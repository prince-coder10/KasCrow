import type { Request, Response, NextFunction } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).single("file"); // field name from client

export function createBuffer(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // Now req.body and req.file are populated
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Type is required",
      });
    }

    if (type === "DOCUMENT" && !req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required for DOCUMENT settlement",
      });
    }

    next();
  });
}
