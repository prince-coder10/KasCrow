//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let express = require("express");
express = __toESM(express);
let http = require("http");
http = __toESM(http);
let ws = require("ws");
ws = __toESM(ws);
let swagger_jsdoc = require("swagger-jsdoc");
swagger_jsdoc = __toESM(swagger_jsdoc);
let swagger_ui_express = require("swagger-ui-express");
swagger_ui_express = __toESM(swagger_ui_express);
let __kluster_kaspa_wasm_node = require("@kluster/kaspa-wasm-node");
__kluster_kaspa_wasm_node = __toESM(__kluster_kaspa_wasm_node);
let crypto = require("crypto");
crypto = __toESM(crypto);
let argon2 = require("argon2");
argon2 = __toESM(argon2);
let mongoose = require("mongoose");
mongoose = __toESM(mongoose);
let zod = require("zod");
zod = __toESM(zod);
let __supabase_supabase_js = require("@supabase/supabase-js");
let jsonwebtoken = require("jsonwebtoken");
jsonwebtoken = __toESM(jsonwebtoken);
let multer = require("multer");
multer = __toESM(multer);
let cookie_parser = require("cookie-parser");
cookie_parser = __toESM(cookie_parser);
let cors = require("cors");
cors = __toESM(cors);
require("dotenv/config");
let node_cron = require("node-cron");
node_cron = __toESM(node_cron);

//#region src/services/kaspaRpcService.ts
var KaspaRpcService = class {
	rpc = null;
	isConnected = false;
	subscribers = /* @__PURE__ */ new Map();
	rpcEventListeners = /* @__PURE__ */ new Map();
	addressSubscribers = /* @__PURE__ */ new Map();
	constructor() {
		__kluster_kaspa_wasm_node.default.initConsolePanicHook();
	}
	getCurrentURL() {
		return this.rpc?.url;
	}
	async connect() {
		if (this.isConnected) {
			console.log("Kaspa RPC Client already connected.");
			return;
		}
		this.rpc = new __kluster_kaspa_wasm_node.RpcClient({
			resolver: new __kluster_kaspa_wasm_node.Resolver(),
			networkId: "testnet-10"
		});
		try {
			await this.rpc.connect({
				timeoutDuration: 2e3,
				blockAsyncConnect: true
			});
			this.isConnected = true;
			console.log("Kaspa RPC Client Connected.");
		} catch (error) {
			console.error("Failed to connect to Kaspa RPC client:", error);
			this.isConnected = false;
			throw error;
		}
	}
	getRpcClient() {
		if (!this.rpc || !this.isConnected) throw new Error("Kaspa RPC Client is not connected.");
		return this.rpc;
	}
	isRpcConnected() {
		return this.isConnected;
	}
	async getBlockDagInfo() {
		return this.getRpcClient().getBlockDagInfo();
	}
	async getBalancesByAddresses(addresses) {
		return this.getRpcClient().getBalancesByAddresses({ addresses });
	}
	broadcast(eventName, data) {
		const clients = this.subscribers.get(eventName);
		if (clients) clients.forEach((ws$1) => {
			if (ws$1.readyState === ws.WebSocket.OPEN) ws$1.send(JSON.stringify({
				event: eventName,
				data
			}));
		});
	}
	async initGlobalUtxoListener() {
		this.getRpcClient().addEventListener("utxos-changed", async (event) => {
			const affectedAddresses = /* @__PURE__ */ new Set();
			event.data.added?.forEach((u) => {
				const addr = typeof u.address === "string" ? u.address : u.address.toString();
				affectedAddresses.add(addr);
			});
			event.data.removed?.forEach((u) => {
				const addr = typeof u.address === "string" ? u.address : u.address.toString();
				affectedAddresses.add(addr);
			});
			for (const address of affectedAddresses) {
				const clients = this.addressSubscribers.get(address);
				if (clients && clients.size > 0) try {
					const balanceData = await this.getBalancesByAddresses([address]);
					const payload = JSON.stringify({
						type: "balance-update",
						address,
						data: balanceData
					});
					clients.forEach((ws$1) => {
						if (ws$1.readyState === ws.WebSocket.OPEN) ws$1.send(payload);
					});
				} catch (err) {
					console.error(`❌ Failed to push balance update for ${address}:`, err);
				}
			}
		});
	}
	/**
	* Call this when a client specifically wants to "watch" an address for balance changes
	*/
	async watchAddress(address, ws$1) {
		if (!this.addressSubscribers.has(address)) {
			this.addressSubscribers.set(address, /* @__PURE__ */ new Set());
			await this.getRpcClient().subscribeUtxosChanged([address]);
		}
		this.addressSubscribers.get(address)?.add(ws$1);
	}
	unwatchAddress(address, ws$1) {
		const clients = this.addressSubscribers.get(address);
		if (clients) clients.delete(ws$1);
	}
	/**
	* Removes a WebSocket client from all address subscriptions.
	* Called when a user disconnects or leaves the escrow page.
	*/
	unwatchAll(ws$1) {
		let count = 0;
		this.addressSubscribers.forEach((clients, address) => {
			if (clients.has(ws$1)) {
				clients.delete(ws$1);
				count++;
				if (clients.size === 0) this.addressSubscribers.delete(address);
			}
		});
		if (count > 0) console.log(`🧹 Cleaned up ${count} address subscriptions for disconnected client.`);
	}
	subscribe(eventName, ws$1) {
		if (!this.subscribers.has(eventName)) {
			this.subscribers.set(eventName, /* @__PURE__ */ new Set());
			this.setupRpcEventListener(eventName);
		}
		this.subscribers.get(eventName)?.add(ws$1);
		console.log(`WebSocket subscribed to ${eventName}. Total subscribers: ${this.subscribers.get(eventName)?.size}`);
	}
	unsubscribe(eventName, ws$1) {
		const clients = this.subscribers.get(eventName);
		if (clients) {
			clients.delete(ws$1);
			if (clients.size === 0) {
				this.subscribers.delete(eventName);
				this.removeRpcEventListener(eventName);
			}
		}
		console.log(`WebSocket unsubscribed from ${eventName}. Remaining subscribers: ${this.subscribers.get(eventName)?.size || 0}`);
	}
	setupRpcEventListener(eventName) {
		if (!this.rpcEventListeners.has(eventName)) {
			const listener = (event) => {
				this.broadcast(eventName, event.data);
			};
			this.rpcEventListeners.set(eventName, listener);
			this.getRpcClient().addEventListener(eventName, listener);
			console.log(`Kaspa RPC client event listener added for ${eventName}`);
			this.activateRpcSubscription(eventName);
		}
	}
	removeRpcEventListener(eventName) {
		const listener = this.rpcEventListeners.get(eventName);
		if (listener) {
			this.getRpcClient().removeEventListener(eventName, listener);
			this.rpcEventListeners.delete(eventName);
			console.log(`Kaspa RPC client event listener removed for ${eventName}`);
		}
	}
	async activateRpcSubscription(eventName) {
		try {
			switch (eventName) {
				case "block-added":
					await this.getRpcClient().subscribeBlockAdded();
					break;
				case "virtual-daa-score-changed":
					await this.getRpcClient().subscribeVirtualDaaScoreChanged();
					break;
				case "virtual-chain-changed":
					await this.getRpcClient().subscribeVirtualChainChanged(true);
					break;
				default: console.warn(`Attempted to activate unknown RPC subscription: ${eventName}`);
			}
			console.log(`Activated RPC subscription for ${eventName}`);
		} catch (error) {
			console.error(`Error activating RPC subscription for ${eventName}:`, error);
		}
	}
};
const kaspaRpcService = new KaspaRpcService();

//#endregion
//#region src/routes/kaspaRoutes.ts
const router$1 = (0, express.Router)();
/**
* @swagger
* /kaspa/daginfo:
*   get:
*     summary: Retrieve Kaspa Block DAG information
*     tags:
*       - Kaspa RPC
*     responses:
*       200:
*         description: Successfully retrieved Block DAG information.
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 networkName:
*                   type: string
*                   example: mainnet
*                 daaScore:
*                   type: string
*                   example: "1234567890"
*                 blockCount:
*                   type: string
*                   example: "1000000"
*       500:
*         description: Internal server error.
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 error:
*                   type: string
*                   example: "Failed to retrieve DAG info"
*/
router$1.get("/daginfo", async (req, res) => {
	try {
		if (!kaspaRpcService.isRpcConnected()) return res.status(500).json({ error: "Kaspa RPC client is not connected." });
		const dagInfo = await kaspaRpcService.getBlockDagInfo();
		res.json(dagInfo);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
/**
* @swagger
* /kaspa/balances:
*   post:
*     summary: Retrieve Kaspa balances for given addresses
*     tags:
*       - Kaspa RPC
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - addresses
*             properties:
*               addresses:
*                 type: array
*                 items:
*                   type: string
*                 example: ["kaspa:qpamkvhgh0kzx50gwvvp5xs8ktmqutcy3dfs9dc3w7lm9rq0zs76vf959mmrp"]
*     responses:
*       200:
*         description: Successfully retrieved balances.
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 # Define properties based on IGetBalancesByAddressesResponse if available
*                 # For now, a generic example:
*                 entries:
*                   type: array
*                   items:
*                     type: object
*                     properties:
*                       address:
*                         type: string
*                       balance:
*                         type: string
*                         format: int64
*       400:
*         description: Invalid request body.
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 error:
*                   type: string
*                   example: "Addresses are required"
*       500:
*         description: Internal server error.
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 error:
*                   type: string
*                   example: "Failed to retrieve balances"
*/
router$1.post("/balances", async (req, res) => {
	try {
		if (!kaspaRpcService.isRpcConnected()) return res.status(500).json({ error: "Kaspa RPC client is not connected." });
		const { addresses } = req.body;
		if (!addresses || !Array.isArray(addresses) || addresses.length === 0) return res.status(400).json({ error: "Addresses array is required." });
		const balances = await kaspaRpcService.getBalancesByAddresses(addresses);
		res.json(balances);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
var kaspaRoutes_default = router$1;

//#endregion
//#region src/config/TR_STATUSES.ts
const TR_STATUS = {
	CREATED: "CREATED",
	AWAITING_PAYMENT: "AWAITING_PAYMENT",
	PARTIALLY_FUNDED: "PARTIALLY_FUNDED",
	FUNDED: "FUNDED",
	AWAITING_RELEASE: "AWAITING_RELEASE",
	RELEASED: "RELEASED",
	REFUNDED: "REFUNDED",
	DISPUTED: "DISPUTED",
	EXPIRED: "EXPIRED"
};
var TR_STATUSES_default = TR_STATUS;

//#endregion
//#region src/escrow/escrow.utils.ts
const KEY_LENGTH = 32;
const ALGORITHM = "aes-256-gcm";
const SALT = Buffer.from(process.env.ESCROW_KEY_SALT || "playerflip-escrow-salt");
const deriveKey = async () => {
	const masterSecret = process.env.ESCROW_MASTER_SECRET;
	if (!masterSecret) throw new Error("ESCROW_MASTER_SECRET not set");
	return argon2.default.hash(masterSecret, {
		type: argon2.default.argon2id,
		salt: SALT,
		memoryCost: 2 ** 16,
		timeCost: 3,
		parallelism: 1,
		hashLength: KEY_LENGTH,
		raw: true
	});
};
const encrypt = async (text) => {
	const key = await deriveKey();
	const iv = crypto.default.randomBytes(12);
	const cipher = crypto.default.createCipheriv(ALGORITHM, key, iv);
	const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([
		iv,
		tag,
		encrypted
	]).toString("base64");
};
const decrypt = async (payload) => {
	const key = await deriveKey();
	const data = Buffer.from(payload, "base64");
	const iv = data.subarray(0, 12);
	const tag = data.subarray(12, 28);
	const encrypted = data.subarray(28);
	const decipher = crypto.default.createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};

//#endregion
//#region src/utils/bufferCalculator.ts
const EXPECTED_TX_COUNT = 3;
const ESTIMATED_TX_FEE_KAS = 1e-5;
const SAFETY_MULTIPLIER = 1.25;
const escrowFeeBuffer = EXPECTED_TX_COUNT * ESTIMATED_TX_FEE_KAS * SAFETY_MULTIPLIER;

//#endregion
//#region src/errors/AppError.ts
var AppError = class extends Error {
	statusCode;
	isOperational;
	constructor(message, statusCode) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = true;
		Error.captureStackTrace(this, this.constructor);
	}
};

//#endregion
//#region src/errors/auth.erros.ts
var UnauthorizedError = class extends AppError {
	constructor(message = "Unauthorized") {
		super(message, 401);
	}
};
var NotFoundError = class extends AppError {
	constructor(message = "Resource not found") {
		super(message, 404);
	}
};
var BadRequestError = class extends AppError {
	constructor(message = "Bad Request") {
		super(message, 400);
	}
};
var InternalServerError = class extends AppError {
	constructor(message = "Internal server error") {
		super(message, 500);
	}
};

//#endregion
//#region src/escrow/machine/escrow.fsm.ts
const ESCROW_TRANSITIONS = {
	CREATED: {
		AWAITING_PAYMENT: ["vendor"],
		EXPIRED: ["system"]
	},
	AWAITING_PAYMENT: {
		PARTIALLY_FUNDED: ["system"],
		FUNDED: ["system"],
		EXPIRED: ["system"]
	},
	PARTIALLY_FUNDED: {
		FUNDED: ["system"],
		EXPIRED: ["system"]
	},
	FUNDED: {
		AWAITING_RELEASE: ["buyer"],
		DISPUTED: ["buyer", "vendor"]
	},
	AWAITING_RELEASE: {
		RELEASED: ["buyer"],
		DISPUTED: ["vendor"]
	},
	RELEASED: {},
	REFUNDED: {},
	EXPIRED: {}
};
function canTransitionEscrow(escrow, nextStatus, actor) {
	const transitions = ESCROW_TRANSITIONS[escrow.status];
	if (!transitions || !transitions[nextStatus]) throw new Error(`Illegal escrow transition: ${escrow.status} → ${nextStatus}`);
	if (!transitions[nextStatus].includes(actor)) throw new Error(`Actor ${actor} cannot perform ${escrow.status} → ${nextStatus}`);
}

//#endregion
//#region src/auth/User.model.ts
const SessionTokenSchema = new mongoose.Schema({ tokenVersion: {
	type: Number,
	default: 0
} }, { timestamps: true });
const UserSchema = new mongoose.Schema({
	walletAddress: {
		type: String,
		required: true,
		unique: true,
		index: true,
		lowercase: true,
		trim: true
	},
	sessionToken: {
		type: SessionTokenSchema,
		default: () => ({})
	},
	isBanned: {
		type: Boolean,
		default: false
	}
}, { timestamps: true });
const User$2 = (0, mongoose.model)("User", UserSchema);

//#endregion
//#region src/config/options.ts
const maxAgeMsForUnfundedEscrows = 1200 * 1e3;
const maxAgeMsForEscrowsNotAcked = 1200 * 1e3;
const Settlement_Type = {
	TEXT: "TEXT",
	DOCUMENT: "DOCUMENT"
};
var options_default = Settlement_Type;

//#endregion
//#region src/escrow/services/escrow.helpers.ts
function getRefundableAmount(escrow) {
	return escrow.utxos.filter((u) => !u.refunded).reduce((sum, u) => sum + BigInt(u.amount), 0n);
}
async function getAddressBalance(escrowAddress) {
	if (!kaspaRpcService.isRpcConnected()) throw new InternalServerError();
	if (typeof escrowAddress !== "string") throw new BadRequestError("address must be a string");
	const balance = await kaspaRpcService.getBalancesByAddresses([escrowAddress]);
	if (!balance) throw new BadRequestError("invalid address");
	return balance;
}

//#endregion
//#region src/escrow/services/escrow.refund.ts
async function executeRefund(escrow) {
	canTransitionEscrow(escrow, TR_STATUSES_default.REFUNDED, "system");
	if (escrow.refundedAt) return;
	const refundable = getRefundableAmount(escrow);
	if (refundable === 0n) return;
	const rpc = kaspaRpcService.getRpcClient();
	const decryptedPrivateKey = await decrypt(escrow.encryptedPrivateKey);
	const NETWORK = process.env.KASPA_NETWORK || "testnet-10";
	const privateKey = new __kluster_kaspa_wasm_node.PrivateKey(decryptedPrivateKey);
	const fromAddress = privateKey.toAddress(NETWORK).toString();
	const utxos = (await rpc.getUtxosByAddresses([fromAddress])).entries || [];
	if (utxos.length === 0) throw new Error("Escrow balance unavailable");
	const priorityFee = 2000n;
	if (utxos.reduce((sum, utxo) => sum + BigInt(utxo.amount), 0n) < refundable) throw new Error("Escrow balance insufficient for refund");
	const finalRefundableAmount = refundable > priorityFee ? refundable - priorityFee : 0n;
	if (finalRefundableAmount <= 0n) throw new Error("Escrow balance too low after fee");
	const tx = (0, __kluster_kaspa_wasm_node.createTransaction)(utxos, [{
		address: escrow.buyerAddress,
		amount: finalRefundableAmount
	}], priorityFee);
	(0, __kluster_kaspa_wasm_node.signTransaction)(tx, [privateKey], true);
	tx.finalize();
	const submitResult = await rpc.submitTransaction({ transaction: tx });
	for (const utxo of escrow.utxos) {
		if (utxo.refunded) continue;
		utxo.refunded = true;
		utxo.refundTxId = submitResult.transactionId;
		utxo.refundedAt = /* @__PURE__ */ new Date();
	}
	escrow.status = TR_STATUSES_default.REFUNDED;
	escrow.refundTxId = submitResult.transactionId;
	escrow.refundedAt = /* @__PURE__ */ new Date();
	await escrow.save();
}

//#endregion
//#region src/escrow/services/escrow.release.ts
async function executeRelease(escrow, senderId) {
	const actor = (await User$2.findById(senderId))?.walletAddress === escrow.buyerAddress ? "buyer" : "vendor";
	canTransitionEscrow(escrow, TR_STATUSES_default.RELEASED, actor);
	console.log("here at top", escrow, escrow.encryptedPrivateKey);
	if (escrow.status === TR_STATUSES_default.RELEASED) throw new Error("Escrow already released");
	console.log("here after transistion");
	if (escrow.status !== TR_STATUSES_default.FUNDED && escrow.status === TR_STATUSES_default.PARTIALLY_FUNDED) throw new Error("Escrow not funded or partially funded");
	console.log("escrow funded properly");
	const rpc = kaspaRpcService.getRpcClient();
	console.log("kaspa service", rpc);
	if (!escrow.encryptedPrivateKey) throw new Error("Escrow private key is missing");
	console.log(escrow.encryptedPrivateKey);
	const decryptedPrivateKey = await decrypt(escrow.encryptedPrivateKey);
	console.log("decrypted", decryptedPrivateKey);
	if (!decryptedPrivateKey) throw new Error("Failed to decrypt escrow private key");
	console.log("here at private");
	const privateKey = new __kluster_kaspa_wasm_node.PrivateKey(decryptedPrivateKey);
	const NETWORK = process.env.KASPA_NETWORK || "testnet-10";
	const fromAddress = privateKey.toAddress(NETWORK).toString();
	const utxos = (await rpc.getUtxosByAddresses([fromAddress])).entries || [];
	if (utxos.length === 0) throw new Error("Escrow balance unavailable or already spent");
	console.log("utxos have length");
	const totalInput = utxos.reduce((sum, utxo) => sum + BigInt(utxo.amount), 0n);
	if (totalInput < BigInt((0, __kluster_kaspa_wasm_node.kaspaToSompi)(escrow.expectedAmount.toString()) ?? 0n)) throw new Error("Escrow underfunded");
	const priorityFee = 2000n;
	const sendAmount = escrow.amount;
	const sendAmountSompi = (0, __kluster_kaspa_wasm_node.kaspaToSompi)(sendAmount.toString()) ?? 0n;
	if (totalInput < sendAmountSompi + priorityFee) throw new Error("Escrow underfunded for release + fee");
	const tx = (0, __kluster_kaspa_wasm_node.createTransaction)(utxos, [{
		address: escrow.vendorAddress,
		amount: sendAmountSompi
	}], priorityFee);
	console.log("transaction created");
	(0, __kluster_kaspa_wasm_node.signTransaction)(tx, [privateKey], true);
	tx.finalize();
	const submitResult = await rpc.submitTransaction({ transaction: tx });
	escrow.status = TR_STATUSES_default.RELEASED;
	escrow.releaseTxId = submitResult.transactionId;
	await escrow.save();
	return submitResult.transactionId;
}
async function allowFundsRelease$1(escrow, actor, settlement, SettlementService$1) {
	const finalSettlement = {};
	if (settlement.type === "TEXT") {
		const { text } = await SettlementService$1.decryptText(settlement, actor);
		console.log("text decrypted", text);
		finalSettlement.content = text;
	} else if (settlement.type === "DOCUMENT") {
		const file = await SettlementService$1.signDownloadUrl(settlement, actor);
		finalSettlement.file = file;
		console.log("file", file);
	} else throw new BadRequestError("Invalid settlement type");
	if (escrow.status !== TR_STATUSES_default.FUNDED) throw new BadRequestError("Escrow not ready for release");
	escrow.status = TR_STATUSES_default.AWAITING_RELEASE;
	await escrow.save();
	return finalSettlement;
}

//#endregion
//#region src/escrow/model/Escrow.ts
const escrowSchema = new mongoose.Schema({
	escrowId: {
		type: String,
		required: true,
		unique: true
	},
	title: {
		type: String,
		required: true
	},
	buyerAddress: {
		type: String,
		required: true,
		index: true
	},
	vendorAddress: {
		type: String,
		required: true,
		index: true
	},
	escrowAddress: {
		type: String,
		required: true,
		unique: true
	},
	encryptedPrivateKey: {
		type: String,
		required: true
	},
	amount: {
		type: Number,
		required: true
	},
	expectedAmount: {
		type: Number,
		required: true
	},
	fundedAmount: {
		type: Number,
		default: 0
	},
	status: {
		type: String,
		enum: Object.values(TR_STATUSES_default),
		required: true,
		index: true
	},
	utxos: [{
		txId: String,
		index: Number,
		amount: Number,
		confirmations: Number
	}],
	fundingTxIds: [{ type: String }],
	releaseTxId: { type: String },
	refundTxId: { type: String },
	refundedAt: { type: Date },
	partiallyFundedAt: { type: Date },
	fundedAt: { type: Date },
	buyerReleasedAt: { type: Date },
	vendorAcknowledgedAt: { type: Date },
	expiresAt: {
		type: Number,
		required: true,
		index: true
	},
	expiredAt: {
		type: Date,
		index: true
	},
	releasedAt: { type: Date }
}, { timestamps: true });
escrowSchema.index({
	buyerAddress: 1,
	status: 1
});
escrowSchema.index({
	vendorAddress: 1,
	status: 1
});
const Escrow$8 = mongoose.default.model("Escrow", escrowSchema);

//#endregion
//#region src/escrow/services/escrow.funding.ts
async function executeFundingUpdate(escrow, utxos) {
	const updateFields = {};
	const balance = utxos.reduce((a, u) => a + BigInt(u.amount), 0n);
	const requiredSompi = (0, __kluster_kaspa_wasm_node.kaspaToSompi)(escrow.expectedAmount.toString()) ?? 0n;
	updateFields.fundedAmount = Number((0, __kluster_kaspa_wasm_node.sompiToKaspaString)(balance));
	const existingUtxoKeys = new Set(escrow.utxos.map((u) => `${u.txId}:${u.index}`));
	const newUtxos = utxos.filter((u) => !existingUtxoKeys.has(`${u.txId}:${u.index}`));
	if (newUtxos.length > 0) updateFields.utxos = [...escrow.utxos, ...newUtxos];
	const existingTxIds = new Set(escrow.fundingTxIds ?? []);
	const newTxIds = newUtxos.map((u) => u.txId).filter((txId) => !existingTxIds.has(txId));
	if (newTxIds.length > 0) updateFields.fundingTxIds = [...escrow.fundingTxIds ?? [], ...newTxIds];
	if (balance < requiredSompi) {
		canTransitionEscrow(escrow, TR_STATUSES_default.PARTIALLY_FUNDED, "system");
		updateFields.status = TR_STATUSES_default.PARTIALLY_FUNDED;
		updateFields.partiallyFundedAt = /* @__PURE__ */ new Date();
	} else {
		canTransitionEscrow(escrow, TR_STATUSES_default.FUNDED, "system");
		updateFields.status = TR_STATUSES_default.FUNDED;
		updateFields.fundedAt = /* @__PURE__ */ new Date();
	}
	await Escrow$8.findByIdAndUpdate(escrow._id, { $set: updateFields }, { new: false });
}

//#endregion
//#region src/escrow/model/Subscription.ts
const subscriptionSchema = new mongoose.Schema({ addresses: {
	type: [String],
	default: []
} });
subscriptionSchema.statics.addAddresses = async function(newAddresses) {
	let sub = await this.findOne();
	if (!sub) sub = await this.create({ addresses: [] });
	sub.addresses = Array.from(new Set([...sub.addresses, ...newAddresses]));
	await sub.save();
	return sub;
};
subscriptionSchema.statics.getAddresses = async function() {
	return (await this.findOne())?.addresses || [];
};
const Subscription = mongoose.default.model("Subscription", subscriptionSchema);

//#endregion
//#region src/escrow/services/kaspaAddressListener.ts
var KaspaAddressListener = class {
	rpc = null;
	subscribedAddresses = /* @__PURE__ */ new Set();
	isSubscribed = false;
	getRpc() {
		if (!this.rpc) this.rpc = kaspaRpcService.getRpcClient();
		return this.rpc;
	}
	async init(initialAddresses) {
		initialAddresses.forEach((a) => this.subscribedAddresses.add(a));
		await this.resubscribe();
	}
	async addAddress(address) {
		if (!address || this.subscribedAddresses.has(address)) return;
		this.subscribedAddresses.add(address);
		await this.resubscribe();
	}
	async addAddresses(addresses) {
		let changed = false;
		for (const addr of addresses) if (addr && !this.subscribedAddresses.has(addr)) {
			this.subscribedAddresses.add(addr);
			changed = true;
		}
		if (changed) await this.resubscribe();
	}
	async resubscribe() {
		const addresses = Array.from(this.subscribedAddresses).map((a) => String(a).trim()).filter((a) => a.length > 0);
		if (addresses.length === 0) {
			console.warn("⚠️ No valid addresses to subscribe");
			return;
		}
		console.log("📡 Subscribing to addresses:", addresses);
		const rpc = this.getRpc();
		if (this.isSubscribed) try {
			await rpc.unsubscribeUtxosChanged();
		} catch (err) {
			console.warn("⚠️ Failed to unsubscribe before resubscribe:", err);
		}
		try {
			await rpc.subscribeUtxosChanged(addresses);
			this.isSubscribed = true;
			console.log("✅ Subscribed successfully:", addresses.length);
		} catch (err) {
			console.error("❌ Failed to subscribe addresses:", err, addresses);
		}
	}
};
const kaspaAddressListener = new KaspaAddressListener();

//#endregion
//#region src/escrow/services/escrow.service.ts
var EscrowService = class {
	constructor(escrowStore$1, SettlementService$1) {
		this.escrowStore = escrowStore$1;
		this.SettlementService = SettlementService$1;
	}
	async createEscrow(title, amount, buyerAddress, vendorAddress) {
		if (title.length < 3) throw new BadRequestError("title should be greater that 3 chars");
		const totalAmountKAS = amount + escrowFeeBuffer;
		const NETWORK = process.env.KASPA_NETWORK || "testnet-10";
		const escrowId = crypto.default.randomUUID();
		const privateKeyHex = crypto.default.randomBytes(32).toString("hex");
		const escrowAddress = new __kluster_kaspa_wasm_node.PrivateKey(privateKeyHex).toAddress(NETWORK).toString();
		const encryptedPrivateKey = await encrypt(privateKeyHex);
		const expiresAt = Date.now() + maxAgeMsForUnfundedEscrows;
		const escrow = await this.escrowStore.create({
			escrowId,
			title,
			buyerAddress,
			vendorAddress,
			escrowAddress,
			amount,
			expectedAmount: totalAmountKAS,
			encryptedPrivateKey,
			status: TR_STATUSES_default.CREATED,
			expiresAt
		});
		await Subscription.updateOne({}, { $addToSet: { addresses: escrowAddress } }, { upsert: true });
		await kaspaAddressListener.addAddress(escrowAddress);
		console.log(`📡 Subscribed to UTXOs for escrow ${escrow.escrowId}`);
		return escrow;
	}
	async createSettlement(escrowId, senderId, settlementData) {
		const { escrow, actor } = await this.getEscrowAndActor(escrowId, senderId);
		canTransitionEscrow(escrow, TR_STATUSES_default.AWAITING_PAYMENT, actor);
		const input = {
			escrow: escrow._id.toString(),
			...settlementData
		};
		console.log("transition valid");
		const settlement = await this.SettlementService.create(input);
		console.log("settlement created successfully");
		escrow.status = TR_STATUSES_default.AWAITING_PAYMENT;
		escrow.vendorAcknowledgedAt = /* @__PURE__ */ new Date();
		await escrow.save();
		return settlement;
	}
	async allowRelease(escrowId, senderId) {
		const { escrow, actor } = await this.getEscrowAndActor(escrowId, senderId);
		console.log("here1", actor, escrow.status);
		canTransitionEscrow(escrow, TR_STATUSES_default.AWAITING_RELEASE, actor);
		console.log("transition valid");
		const settlement = await this.SettlementService.getSettlmentByEscrow(escrow._id.toString());
		console.log("settlement found", settlement);
		return allowFundsRelease$1(escrow, actor, settlement, this.SettlementService);
	}
	async refundBuyer(escrow) {
		return executeRefund(escrow);
	}
	async getEscrowAndActor(escrowId, senderId) {
		const escrow = await this.getEscrowById(escrowId);
		if (!escrow) throw new NotFoundError("Escrow not found");
		const sender = await User$2.findOne({ _id: senderId });
		if (!sender) throw new NotFoundError("Address is not linked to any account");
		return {
			escrow,
			actor: sender.walletAddress === escrow.vendorAddress ? "vendor" : "buyer"
		};
	}
	async applyFundingUpdate(escrow, utxos) {
		return executeFundingUpdate(escrow, utxos);
	}
	async handlePartialRefundAndExpiry(escrow) {
		canTransitionEscrow(escrow, TR_STATUSES_default.EXPIRED, "system");
		await this.refundBuyer(escrow);
		escrow.status = TR_STATUSES_default.EXPIRED;
		escrow.expiredAt = /* @__PURE__ */ new Date();
		await escrow.save();
	}
	async handlePossibleExpiry(escrow) {
		console.log("here1");
		const now = Date.now();
		const isExpired = now >= escrow.expiresAt;
		console.log("here2", isExpired, {
			now,
			expiresAt: escrow.expiresAt
		});
		console.log("here2", isExpired);
		if (!isExpired) return;
		switch (escrow.status) {
			case TR_STATUSES_default.CREATED:
			case TR_STATUSES_default.AWAITING_PAYMENT:
				canTransitionEscrow(escrow, TR_STATUSES_default.EXPIRED, "system");
				escrow.status = TR_STATUSES_default.EXPIRED;
				escrow.expiredAt = new Date(now);
				break;
			case TR_STATUSES_default.PARTIALLY_FUNDED:
				await this.handlePartialRefundAndExpiry(escrow);
				break;
		}
		await escrow.save();
	}
	async getEscrowByAddress(escrowAddress) {
		return this.escrowStore.getByAddress(escrowAddress);
	}
	async getEscrowsByAddress(userAddress) {
		return this.escrowStore.getEscrowsByAddress(userAddress);
	}
	async getEscrowBalance(escrowAddress) {
		return getAddressBalance(escrowAddress);
	}
	async getEscrowById(escrowId) {
		return this.escrowStore.getById(escrowId);
	}
	async getPendingEscrows() {
		return this.escrowStore.getPendingEscrows();
	}
	async getUsersPendingEscrows(address) {
		return this.escrowStore.getUserPendingEscrows(address);
	}
	async getUnackedEscrows(address) {
		return this.escrowStore.getUnackedEscrows(address);
	}
	async getDashboardStats(address) {
		return {
			activeEscrows: (await this.escrowStore.getPendingEscrows()).length,
			completedEscrows: (await this.escrowStore.getUserCompletedEscrows(address)).length,
			unackedEscrows: (await this.getUnackedEscrows(address)).length,
			recentEscrows: await this.escrowStore.getUserRecentEscrows(address),
			totalReceived: await this.escrowStore.getUserTotalReceived(address)
		};
	}
	async releaseEscrowFunds(escrowId, senderId) {
		const escrow = await this.escrowStore.getById(escrowId);
		if (!escrow) throw new Error("Escrow not found");
		return executeRelease(escrow, senderId);
	}
};

//#endregion
//#region src/escrow/escrow.store.ts
var EscrowStore = class {
	async create(data) {
		return await Escrow$8.create(data);
	}
	async getById(escrowId) {
		return Escrow$8.findOne({ escrowId });
	}
	async getByAddress(escrowAddress) {
		return Escrow$8.findOne({ escrowAddress });
	}
	async getEscrowsByAddress(userAddress) {
		const normalized = userAddress.toLowerCase();
		return Escrow$8.find({ $or: [{ buyerAddress: normalized }, { vendorAddress: normalized }] }).sort({ createdAt: -1 });
	}
	async getPendingEscrows() {
		return Escrow$8.find({ status: { $in: [
			"CREATED",
			"AWAITING_PAYMENT",
			"PARTIALLY_FUNDED"
		] } });
	}
	async getUserCompletedEscrows(address) {
		return Escrow$8.find({
			status: "RELEASED",
			$or: [{ buyerAddress: address }, { vendorAddress: address }]
		});
	}
	async getUserPendingEscrows(address) {
		return Escrow$8.find({
			status: { $in: [
				"CREATED",
				"AWAITING_PAYMENT",
				"PARTIALLY_FUNDED",
				"FUNDED",
				"AWAITING_RELEASE"
			] },
			$or: [{ buyerAddress: address }, { vendorAddress: address }]
		});
	}
	async getUnackedEscrows(address) {
		return Escrow$8.find({
			status: "CREATED",
			vendorAddress: address
		});
	}
	async getUserRecentEscrows(address) {
		return Escrow$8.find({ $or: [{ buyerAddress: address }, { vendorAddress: address }] }).sort({ createdAt: -1 }).limit(3);
	}
	async getUserTotalReceived(address) {
		return (await Escrow$8.aggregate([{ $match: {
			vendorAddress: address,
			status: "RELEASED"
		} }, { $group: {
			_id: null,
			totalReceived: { $sum: "$amount" }
		} }]))[0]?.totalReceived || 0;
	}
	async expireOldEscrows(olderThanMs) {
		const cutoff = new Date(Date.now() - olderThanMs);
		return Escrow$8.updateMany({
			status: "AWAITING_PAYMENT",
			createdAt: { $lt: cutoff }
		}, { status: "EXPIRED" });
	}
};

//#endregion
//#region src/utils/catchError.ts
const catchError = (res, error) => {
	return res.status(error instanceof AppError && "statusCode" in error ? error.statusCode : 500).json({
		success: false,
		message: error instanceof AppError ? error.message : "Internal server error",
		error
	});
};

//#endregion
//#region src/utils/zod.ts
const createSettlementSchema = zod.default.object({
	escrow: zod.default.string(),
	type: zod.default.enum(["TEXT", "DOCUMENT"]),
	content: zod.default.string().optional(),
	file: zod.default.object({
		buffer: zod.default.any(),
		mimeType: zod.default.string(),
		filename: zod.default.string()
	}).optional()
});

//#endregion
//#region src/settlement/settlement.service.ts
var SettlementService = class {
	constructor(settlementStore, fileStore) {
		this.settlementStore = settlementStore;
		this.fileStore = fileStore;
	}
	async create(input) {
		if (!createSettlementSchema.safeParse(input).success) throw new BadRequestError("Invalid settlement data");
		console.log("valid input success", input.type);
		const settlementData = {};
		if (input.type === options_default.TEXT) {
			if (!input.content) throw new BadRequestError("Settlement of type 'TEXT' must have content");
			settlementData.content = await encrypt(input.content);
		}
		if (input.type === options_default.DOCUMENT) {
			if (!input.file) throw new BadRequestError("Settlement of type 'DOCUMENT' must include a file");
			settlementData.fileUrl = await this.fileStore.uploadPrivateFile({
				buffer: input.file.buffer,
				mimeType: input.file.mimeType,
				filename: input.file.filename
			});
		}
		const final = {
			escrow: input.escrow,
			type: input.type,
			...settlementData
		};
		console.log("final settlement data", final);
		return this.settlementStore.create(final);
	}
	async getSettlmentByEscrow(_id) {
		const settlement = await this.settlementStore.getByEscrow(_id);
		if (!settlement) throw new NotFoundError("settlement was not found");
		return settlement;
	}
	async signDownloadUrl(settlement, actor) {
		if (actor !== "buyer") throw new UnauthorizedError();
		if (settlement.type === "TEXT") throw new BadRequestError("Cannot sign url for file of type 'TEXT'");
		const fileKey = settlement.fileUrl;
		if (!fileKey) throw new BadRequestError("file was not found");
		const { signedUrl, expiresIn: expiresIn$1 } = await this.fileStore.signDownloadUrl(fileKey);
		return {
			signedUrl,
			expiresIn: expiresIn$1
		};
	}
	async decryptText(settlement, actor) {
		if (actor !== "buyer") throw new UnauthorizedError();
		if (settlement.type === "DOCUMENT") throw new BadRequestError("Cannot decrypt for file of type 'DOCUMENT'");
		const payload = settlement.content;
		if (!payload) throw new BadRequestError("file was not found");
		return { text: await decrypt(payload) };
	}
};

//#endregion
//#region src/settlement/model/Settlement.ts
const settlementSchema = new mongoose.Schema({
	escrow: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Escrow",
		required: true,
		index: true
	},
	type: {
		type: String,
		enum: ["TEXT", "DOCUMENT"]
	},
	content: { type: String },
	fileUrl: { type: String },
	mimeType: {
		type: String,
		enum: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
	},
	providedAt: {
		type: Date,
		default: Date.now
	},
	acceptedAt: { type: Date }
}, { timestamps: true });
const Settlement$8 = mongoose.default.model("Settlement", settlementSchema);

//#endregion
//#region src/settlement/settlement.store.ts
var SettlementStore = class {
	async create(data) {
		return Settlement$8.create(data);
	}
	async getById(id) {
		return Settlement$8.findById(id).exec();
	}
	async getByEscrow(escrowId) {
		return Settlement$8.findOne({ escrow: escrowId }).exec();
	}
	async update(id, data) {
		return Settlement$8.findOneAndUpdate({ _id: id }, data, {
			new: true,
			runValidators: true
		}).exec();
	}
	async accept(id) {
		return Settlement$8.findByIdAndUpdate(id, { acceptedAt: /* @__PURE__ */ new Date() }, { new: true }).exec();
	}
};

//#endregion
//#region src/settlement/files/fileStore.service.ts
var FileStorageService = class {
	supabase;
	bucket;
	constructor() {
		this.bucket = process.env.SUPABASE_BUCKET;
		this.supabase = (0, __supabase_supabase_js.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
	}
	async uploadPrivateFile(data) {
		const { buffer, mimeType, filename } = data;
		const objectPath = `${crypto.default.randomUUID()}/${filename}`;
		const { error } = await this.supabase.storage.from(this.bucket).upload(objectPath, buffer, {
			contentType: mimeType,
			upsert: false
		});
		if (error) throw error;
		return objectPath;
	}
	async signDownloadUrl(fileKey) {
		const ttl = 10;
		const { data, error } = await this.supabase.storage.from(this.bucket).createSignedUrl(fileKey, 60 * ttl);
		if (error) throw error;
		return {
			signedUrl: data.signedUrl,
			expiresIn: `${ttl} minutes`
		};
	}
};

//#endregion
//#region src/escrow/controllers/createEscrow.ts
const Settlement$7 = new SettlementService(new SettlementStore(), new FileStorageService());
const Escrow$7 = new EscrowService(new EscrowStore(), Settlement$7);
const createEscrow = async (req, res) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({
			success: false,
			message: "Unauthorized to perfom this action"
		});
		const { title, amount, vendorAddress } = req.body;
		if (!title || !amount || !vendorAddress) return res.status(400).json({ error: "title, amount and vendorAddress required" });
		const buyerAddress = user.wallet;
		if (typeof title !== "string") return res.status(400).json({
			success: false,
			message: "Invalid type. title should be a string"
		});
		if (typeof buyerAddress !== "string" || typeof vendorAddress !== "string") return res.status(400).json({
			success: false,
			message: "Invalid type. addresses should be strings"
		});
		const escrow = await Escrow$7.createEscrow(title, Number(amount), buyerAddress, vendorAddress);
		res.json({
			success: true,
			escrow
		});
	} catch (error) {
		catchError(res, error);
	}
};

//#endregion
//#region src/escrow/controllers/getEscrowStatus.ts
const Settlement$6 = new SettlementService(new SettlementStore(), new FileStorageService());
const Escrow$6 = new EscrowService(new EscrowStore(), Settlement$6);
const getEscrowStatus = async (req, res) => {
	try {
		if (!req.user) return res.status(401).json({
			success: false,
			message: "Unauthorized to perfom this action"
		});
		const { id } = req.params;
		if (!id || typeof id !== "string") return res.status(400).json({ error: "Invalid escrow ID" });
		const escrow = await Escrow$6.getEscrowById(id);
		if (!escrow) return res.status(404).json({ error: "Escrow not found" });
		res.json({ status: escrow.status });
	} catch (error) {
		catchError(res, error);
	}
};

//#endregion
//#region src/escrow/controllers/releaseEscrow.ts
const Settlement$5 = new SettlementService(new SettlementStore(), new FileStorageService());
const Escrow$5 = new EscrowService(new EscrowStore(), Settlement$5);
const releaseEscrowFunds = async (req, res) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({
			success: false,
			message: "Unauthorized to perfom this action"
		});
		const { id } = req.params;
		if (!id || typeof id !== "string") return res.status(400).json({ error: "Invalid escrow ID" });
		const txId = await Escrow$5.releaseEscrowFunds(id, user.id);
		res.json({
			success: true,
			txId
		});
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
};

//#endregion
//#region src/escrow/controllers/vendorAck.ts
const Settlement$4 = new SettlementService(new SettlementStore(), new FileStorageService());
const Escrow$4 = new EscrowService(new EscrowStore(), Settlement$4);
async function acknowledgeEscrow(req, res) {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({
			success: false,
			message: "Unauthorized"
		});
		console.log("here, user auth successful");
		const { escrowId } = req.params;
		if (!escrowId) return res.status(400).json({
			success: false,
			message: "Escrow id is required"
		});
		console.log("here, escrow id is valid");
		if (typeof escrowId !== "string" || escrowId.trim().length === 0) return res.status(400).json({
			success: false,
			message: "Escrow id must be a non-empty string"
		});
		console.log("here, escrow id is valid");
		const { type, content } = req.body;
		console.log("here, type and content are ", type, content);
		const settlementInput = {
			type,
			content,
			file: req.file ? {
				buffer: req.file.buffer,
				mimeType: req.file.mimetype,
				filename: req.file.originalname
			} : void 0
		};
		const settlement = await Escrow$4.createSettlement(escrowId, user.id, settlementInput);
		console.log("here, settlement is created successfully", settlement);
		return res.status(200).json({
			success: true,
			message: "Escrow acknowledged successfully",
			data: settlement
		});
	} catch (error) {
		catchError(res, error);
	}
}

//#endregion
//#region src/escrow/controllers/allowRelease.ts
const Settlement$3 = new SettlementService(new SettlementStore(), new FileStorageService());
const Escrow$3 = new EscrowService(new EscrowStore(), Settlement$3);
async function allowFundsRelease(req, res) {
	console.log("here1");
	try {
		const user = req.user;
		if (!user) return res.status(401).json({
			success: false,
			message: "Unauthorized to perfom this action"
		});
		console.log("user available");
		const senderId = user.id;
		const { escrowId } = req.params;
		if (!escrowId || !senderId) return res.status(400).json({
			success: false,
			message: "escrow id and sender id are required"
		});
		if (typeof escrowId !== "string" || typeof senderId !== "string") return res.status(400).json({
			success: false,
			message: "escrow id and sender id should be of type 'string'"
		});
		console.log("escrow id and sender id available");
		const settlement = await Escrow$3.allowRelease(escrowId, senderId);
		res.status(200).json({
			success: true,
			messsage: "Settlement verified and escrow funds now available for release",
			settlement
		});
	} catch (error) {
		catchError(res, error);
	}
}

//#endregion
//#region src/utils/jwt.ts
const sessionSecret = process.env.SESSION_TOKEN_SECRET;
const expiresIn = +process.env.SESSION_EXPIRES_IN;
function signSessionToken(payload) {
	return jsonwebtoken.default.sign(payload, sessionSecret, { expiresIn });
}
function verifySessionToken(token) {
	return jsonwebtoken.default.verify(token, sessionSecret);
}

//#endregion
//#region src/middleware/requireAuth.ts
async function requireAuth(req, res, next) {
	try {
		const cookieName$2 = process.env.COOKIE_NAME;
		const sessionToken = req.cookies?.[cookieName$2];
		if (!sessionToken) return res.status(401).json({ message: "Unauthenticated" });
		const payload = verifySessionToken(sessionToken);
		const user = await User$2.findById(payload.sub);
		if (!user) return res.status(401).json({ message: "Invalid session" });
		if (user.isBanned) return res.status(403).json({ message: "User is banned" });
		if (user.sessionToken.tokenVersion !== payload.v) return res.status(401).json({ message: "Session revoked" });
		req.user = {
			id: user.id,
			wallet: user.walletAddress
		};
		next();
	} catch {
		return res.status(401).json({ message: "Invalid or expired session" });
	}
}

//#endregion
//#region src/escrow/controllers/getUserEscrows.ts
const Settlement$2 = new SettlementService(new SettlementStore(), new FileStorageService());
const Escrow$2 = new EscrowService(new EscrowStore(), Settlement$2);
async function getUserEscrows(req, res) {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({
			success: false,
			message: "Unauthorized to perfom this action"
		});
		const escrows = await Escrow$2.getEscrowsByAddress(user.wallet);
		return res.status(200).json({
			success: true,
			message: "escrows fetched successfully",
			escrows
		});
	} catch (error) {
		catchError(res, error);
	}
}
async function getSingleEscrow(req, res) {
	try {
		if (!req.user) return res.status(401).json({
			success: false,
			message: "Unauthorized to perfom this action"
		});
		const { escrowId } = req.params;
		if (!escrowId || typeof escrowId !== "string") return res.status(400).json({ error: "Invalid escrow ID" });
		const escrow = await Escrow$2.getEscrowById(escrowId);
		if (!escrow) return res.status(404).json({
			success: false,
			message: "escrow not found",
			escrow
		});
		return res.status(200).json({
			success: true,
			message: "escrow retrieved successfully",
			escrow
		});
	} catch (error) {
		catchError(res, error);
	}
}
async function getUnackedEscrows(req, res) {
	console.log("getUnackedEscrows");
	try {
		const user = req.user;
		if (!user) return res.status(401).json({
			success: false,
			message: "Unauthorized to perfom this action"
		});
		const escrows = await Escrow$2.getUnackedEscrows(user.wallet);
		console.log(escrows);
		return res.status(200).json({
			success: true,
			message: "escrow retrieved successfully",
			escrows
		});
	} catch (error) {
		catchError(res, error);
	}
}

//#endregion
//#region src/middleware/upload.ts
const upload = (0, multer.default)({
	storage: multer.default.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 }
}).single("file");
function createBuffer(req, res, next) {
	upload(req, res, (err) => {
		if (err) return res.status(400).json({
			success: false,
			message: err.message
		});
		const { type } = req.body;
		if (!type) return res.status(400).json({
			success: false,
			message: "Type is required"
		});
		if (type === "DOCUMENT" && !req.file) return res.status(400).json({
			success: false,
			message: "File is required for DOCUMENT settlement"
		});
		next();
	});
}

//#endregion
//#region src/escrow/controllers/dashboard.controller.ts
const Settlement$1 = new SettlementService(new SettlementStore(), new FileStorageService());
const Escrow$1 = new EscrowService(new EscrowStore(), Settlement$1);
const getDashboardStats = async (req, res) => {
	try {
		const user = req.user;
		if (!user) return res.status(401).json({
			success: false,
			message: "Unauthorized to perfom this action"
		});
		const stats = await Escrow$1.getDashboardStats(user.wallet);
		if (!stats) return res.status(404).json({
			success: false,
			message: "No stats found"
		});
		return res.status(200).json({
			success: true,
			message: "Dashboard stats fetched successfully",
			stats
		});
	} catch (error) {
		catchError(res, error);
	}
};

//#endregion
//#region src/routes/escrow.routes.ts
const router = (0, express.Router)();
router.post("/create", requireAuth, createEscrow);
router.post("/:escrowId/settlement/ack", requireAuth, createBuffer, acknowledgeEscrow);
router.get("/dashboard", requireAuth, getDashboardStats);
router.get("/:id/status", requireAuth, getEscrowStatus);
router.post("/:escrowId/allow", requireAuth, allowFundsRelease);
router.post("/:id/release", requireAuth, releaseEscrowFunds);
router.get("/unacked", requireAuth, getUnackedEscrows);
router.get("/:escrowId", requireAuth, getSingleEscrow);
router.get("/", requireAuth, getUserEscrows);
var escrow_routes_default = router;

//#endregion
//#region src/auth/auth.service.ts
var UserService = class {
	constructor(userStore) {
		this.userStore = userStore;
	}
	async findOrCreateUser(walletAddress) {
		if (!walletAddress) throw new Error("Wallet address is required");
		const user = await this.userStore.findOrCreate(walletAddress);
		if (user.isBanned) throw new Error("User is banned");
		return user;
	}
	issueJWT(user) {
		if (user.isBanned) throw new Error("User is banned");
		const tokenVersion = user.sessionToken.tokenVersion;
		return signSessionToken({
			sub: user._id.toString(),
			wallet: user.walletAddress,
			v: tokenVersion,
			iat: Date.now()
		});
	}
	async getUserByWallet(walletAddress) {
		if (!walletAddress) throw new Error("Wallet address is required");
		const user = await this.userStore.getByWallet(walletAddress);
		if (!user) throw new Error("User not found");
		return user;
	}
	async getUserById(userId) {
		if (!userId) throw new Error("user id is required");
		const user = await this.userStore.getById(userId);
		if (!user) throw new Error("User not found");
		return user;
	}
	async banUser(walletAddress) {
		return this.userStore.updateBanStatus(walletAddress, true);
	}
	async unbanUser(walletAddress) {
		return this.userStore.updateBanStatus(walletAddress, false);
	}
	async invalidateUserSession(userId) {
		if (!userId) throw new Error("User ID is required");
		return this.userStore.incrementTokenVersion(userId);
	}
};

//#endregion
//#region src/auth/auth.store.ts
var UserStore = class {
	async createUser(walletAddress) {
		return await User$2.create({ walletAddress });
	}
	async getByWallet(walletAddress) {
		return await User$2.findOne({ walletAddress });
	}
	async getById(userId) {
		return await User$2.findOne({ _id: userId });
	}
	async findOrCreate(walletAddress) {
		const existingUser = await User$2.findOne({ walletAddress });
		if (existingUser) return existingUser;
		return await User$2.create({ walletAddress });
	}
	async updateSessionToken(walletAddress, tokenHash) {
		if (!tokenHash) return User$2.findOneAndUpdate({ walletAddress }, { $set: { sessionToken: null } }, { new: true });
		return await User$2.findOneAndUpdate({ walletAddress }, { $set: { sessionToken: {
			tokenHash,
			createdAt: /* @__PURE__ */ new Date()
		} } }, {
			new: true,
			upsert: false
		});
	}
	async updateBanStatus(walletAddress, isBanned) {
		return await User$2.findOneAndUpdate({ walletAddress }, { isBanned }, { new: true });
	}
	async incrementTokenVersion(userId) {
		return await User$2.findByIdAndUpdate(userId, { $inc: { "sessionToken.tokenVersion": 1 } }, { new: true });
	}
};

//#endregion
//#region src/auth/controllers/login.controller.ts
const User$1 = new UserService(new UserStore());
const cookieName$1 = process.env.COOKIE_NAME;
const loginUser = async (req, res) => {
	try {
		const { walletAddress } = req.body;
		if (!walletAddress || typeof walletAddress !== "string") return res.status(400).json({
			success: false,
			message: "Wallet address must be provided as a string"
		});
		const user = await User$1.findOrCreateUser(walletAddress);
		if (!user) return res.status(400).json({
			success: false,
			message: "User registration failed"
		});
		const sessionToken = User$1.issueJWT(user);
		if (!sessionToken) return res.status(400).json({
			success: false,
			message: "Error authorizing user"
		});
		res.cookie(cookieName$1, sessionToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
			maxAge: 4320 * 60 * 1e3
		});
		return res.status(200).json({
			success: true,
			message: "User logged in successfully",
			data: {
				id: user._id,
				wallet: user.walletAddress
			}
		});
	} catch (error) {
		console.log("Error logging in user:", error);
		return catchError(res, error);
	}
};

//#endregion
//#region src/auth/controllers/logout.controller.ts
const User = new UserService(new UserStore());
const cookieName = process.env.COOKIE_NAME;
const logoutUser = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (userId) await User.invalidateUserSession(userId);
		res.clearCookie(cookieName, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax"
		});
		return res.status(200).json({
			success: true,
			message: "User logged out successfully"
		});
	} catch (error) {
		console.log("Error logging out user:", error);
		return catchError(res, error);
	}
};

//#endregion
//#region src/auth/controllers/profile.controller.ts
new UserService(new UserStore());
process.env.COOKIE_NAME;
const getProfile = async (req, res) => {
	try {
		if (!req.user) return res.status(401).json({
			success: false,
			message: "Unauthorized to perfom this action"
		});
		const id = req.user?.id;
		const walletAddress = req.user?.wallet;
		return res.status(200).json({
			success: true,
			message: "User logged in successfully",
			data: {
				id,
				wallet: walletAddress
			}
		});
	} catch (error) {
		console.log("Error logging in user:", error);
		return catchError(res, error);
	}
};

//#endregion
//#region src/routes/auth.routes.ts
const authRoute = (0, express.Router)();
authRoute.post("/wallet", loginUser);
authRoute.post("/logout", requireAuth, logoutUser);
authRoute.get("/profile", requireAuth, getProfile);
var auth_routes_default = authRoute;

//#endregion
//#region src/app.ts
const app = (0, express.default)();
app.set("json replacer", (_key, value) => {
	if (typeof value === "bigint") return value.toString();
	return value;
});
const allowedOrigins = ["https://kascrow.vercel.app", "http://localhost:5173"];
app.use((0, cors.default)({
	origin: (origin, callback) => {
		if (!origin || allowedOrigins.includes(origin)) callback(null, true);
		else callback(/* @__PURE__ */ new Error("Not allowed by CORS"));
	},
	credentials: true
}));
app.use(express.default.urlencoded({ extended: false }));
app.use((0, cookie_parser.default)());
app.use(express.default.json());
const swaggerDocs = (0, swagger_jsdoc.default)({
	swaggerDefinition: {
		openapi: "3.0.0",
		info: {
			title: "Kaspa Node.js Starter Kit API",
			version: "1.0.0",
			description: "API documentation for the Kaspa Node.js Starter Kit"
		},
		servers: [{
			url: "http://localhost:3000",
			description: "Development server"
		}]
	},
	apis: ["./src/routes/*.ts"]
});
app.use("/api-docs", swagger_ui_express.default.serve, swagger_ui_express.default.setup(swaggerDocs));
app.get("/", (req, res) => {
	res.send("Kaspa Node.js Starter Kit API");
});
app.use("/kaspa", kaspaRoutes_default);
app.use("/api/v1/escrow", escrow_routes_default);
app.use("/api/v1/auth", auth_routes_default);
const server = http.createServer(app);
const wss = new ws.WebSocketServer({ server });
const stringify = (obj) => JSON.stringify(obj, (key, value) => typeof value === "bigint" ? value.toString() : value);
wss.on("connection", (ws$1) => {
	console.log("WebSocket client connected");
	ws$1.on("message", async (message) => {
		try {
			const parsedMessage = JSON.parse(message.toString());
			console.log("parsed message", parsedMessage);
			const { type, event, payload, requestId } = parsedMessage;
			switch (type) {
				case "get-balance":
					if (!payload?.address) return sendError(ws$1, "Address required", requestId);
					try {
						const res = await kaspaRpcService.getBalancesByAddresses([payload.address]);
						const final = [{
							address: res.entries[0]?.address,
							balance: (0, __kluster_kaspa_wasm_node.sompiToKaspaString)(res.entries[0]?.balance ?? 0n)
						}];
						console.log(final);
						ws$1.send(stringify({
							type: "balance-response",
							requestId,
							data: final
						}));
					} catch (err) {
						sendError(ws$1, err.message, requestId);
					}
					break;
				case "watch-address":
					if (!payload?.address) return sendError(ws$1, "Address required", requestId);
					try {
						await kaspaRpcService.watchAddress(payload.address, ws$1);
						const initialBalance = await kaspaRpcService.getBalancesByAddresses([payload.address]);
						ws$1.send(JSON.stringify({
							type: "balance-update",
							address: payload.address,
							data: initialBalance
						}));
					} catch (err) {
						sendError(ws$1, err.message, requestId);
					}
					break;
				case "subscribe":
					if (event) kaspaRpcService.subscribe(event, ws$1);
					break;
				case "unsubscribe":
					if (event) kaspaRpcService.unsubscribe(event, ws$1);
					break;
				default: ws$1.send(JSON.stringify({ error: "Unknown message type" }));
			}
		} catch (error) {
			console.error("Failed to parse WebSocket message:", error);
		}
	});
	ws$1.on("close", () => {
		console.log("WebSocket client disconnected");
		kaspaRpcService.unwatchAll(ws$1);
		[
			"block-added",
			"virtual-daa-score-changed",
			"virtual-chain-changed"
		].forEach((event) => {
			kaspaRpcService.unsubscribe(event, ws$1);
		});
	});
});
function sendError(ws$1, message, requestId) {
	if (ws$1.readyState === ws.WebSocket.OPEN) ws$1.send(JSON.stringify({
		type: "error",
		message,
		requestId
	}));
}

//#endregion
//#region src/escrow/escrow.listener.ts
const Settlement = new SettlementService(new SettlementStore(), new FileStorageService());
const Escrow = new EscrowService(new EscrowStore(), Settlement);
let listenersAttached = false;
async function startEscrowListener() {
	console.log("🟢 Escrow listener starting...");
	try {
		await kaspaRpcService.connect();
	} catch (err) {
		console.error("❌ Failed to connect Kaspa RPC:", err);
		return;
	}
	const rpc = kaspaRpcService.getRpcClient();
	const addresses = ((await Subscription.findOne({}))?.addresses ?? []).map((a) => String(a).trim()).filter((a) => a.length > 0);
	console.log("📡 Initial sanitized addresses:", addresses);
	if (addresses.length > 0) try {
		await kaspaAddressListener.init(addresses);
	} catch (err) {
		console.error("❌ Failed to subscribe to initial addresses:", err);
	}
	else console.warn("⚠️ No escrow addresses to subscribe yet");
	if (!listenersAttached) {
		listenersAttached = true;
		rpc.addEventListener("utxos-changed", async (event) => {
			try {
				const added = event?.data?.added ?? [];
				if (!added.length) return;
				const utxosByAddress = /* @__PURE__ */ new Map();
				for (const u of added) {
					const address = u.address?.toString();
					if (!address) continue;
					const utxo = {
						txId: u.outpoint.transactionId,
						index: u.outpoint.index,
						amount: Number(u.amount),
						address,
						confirmations: 0,
						refunded: false
					};
					if (!utxosByAddress.has(address)) utxosByAddress.set(address, []);
					utxosByAddress.get(address).push(utxo);
				}
				for (const [address, utxos] of utxosByAddress.entries()) {
					const escrow = await Escrow.getEscrowByAddress(address);
					if (!escrow) continue;
					await Escrow.applyFundingUpdate(escrow, utxos);
				}
			} catch (err) {
				console.error("❌ utxos-changed handling failed:", err);
			}
		});
		try {
			await rpc.subscribeVirtualChainChanged(true);
			rpc.addEventListener("virtual-chain-changed", async () => {});
		} catch (err) {
			console.error("❌ Failed to subscribe virtual chain:", err);
		}
	}
	console.log("🟢 Escrow listener fully active");
}

//#endregion
//#region src/config/mongo.ts
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING || "";
const connectDB = async () => {
	try {
		await mongoose.default.connect(mongoConnectionString);
		console.log("🟢 Connected to MongoDB");
	} catch (error) {
		console.error("MongoDB connection error:", error);
		process.exit(1);
	}
};

//#endregion
//#region src/escrow/workers/escrowExpiry.worker.ts
const escrowStore = new EscrowStore();
const escrowService = new EscrowService(escrowStore);
/**
* Escrow Expiry Worker
* - Runs every minute (configurable)
* - Fetches all pending escrows
* - Handles expiry and partial refunds
* - Logs all operations
*/
node_cron.default.schedule("*/2 * * * *", async () => {
	console.log(`[EscrowExpiryWorker] Running at ${(/* @__PURE__ */ new Date()).toISOString()}`);
	try {
		const escrows = await escrowStore.getPendingEscrows();
		if (escrows.length === 0) {
			console.log("[EscrowExpiryWorker] No pending escrows found");
			return;
		}
		for (const escrow of escrows) try {
			await escrowService.handlePossibleExpiry(escrow);
			console.log(`[EscrowExpiryWorker] Escrow ${escrow.escrowId} processed: ${escrow.status}`);
		} catch (escrowErr) {
			console.error(`[EscrowExpiryWorker] Failed to process escrow ${escrow.escrowId}:`, escrowErr);
		}
	} catch (err) {
		console.error("[EscrowExpiryWorker] Worker failed:", err);
	}
});
console.log("[EscrowExpiryWorker] Cron worker scheduled (every 2 minutes)");

//#endregion
//#region src/index.ts
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
const boot = async () => {
	try {
		console.log("Connecting to Kaspa RPC...");
		await kaspaRpcService.connect();
		console.log(`Kaspa RPC connected to ${kaspaRpcService.getCurrentURL()}`);
		await connectDB();
		await startEscrowListener();
	} catch (error) {
		console.error("Failed to connect Kaspa RPC on boot:", error);
	}
	server.listen(PORT, "0.0.0.0", () => {
		console.log(`Server is running on port ${PORT}`);
		console.log("API documentation available at /api-docs");
	});
};
boot().catch(console.error);

//#endregion
//# sourceMappingURL=index.cjs.map