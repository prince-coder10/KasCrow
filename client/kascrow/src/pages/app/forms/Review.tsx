import { ShieldCheck } from "lucide-react";

interface Props {
  formData: { title: string; amount: string; vendor: string };
}

function Review({ formData }: Props) {
  return (
    <div>
      <div className="relative bg-[#161E2E]/50 text-primary rounded-lg p-4 border border-[#22D3EE]/20 flex items-start gap-3">
        <ShieldCheck size={22} className="absolute left-0 top-4" />
        <div className="ml-2">
          <p className="text-sm font-semibold text-white">Security Check</p>
          <p className="text-[10px] not-first:font-normal text-muted/50">
            Funds are locked in a Kaspa UTXO-based escrow address with
            protocol-enforced release rules. Funds can only be released by
            mutual confirmation or after a predefined timeout.
          </p>
        </div>
      </div>
      <div className="flex flex-col mt-5 gap-5 *:border-b *:border-muted/20 *:py-2">
        <div className="flex items-center justify-between text-sm text-muted/50">
          <p>Deal Title</p> <p className="text-white">{formData.title}</p>
        </div>
        <div className="flex items-center justify-between text-muted/50">
          <p>Amount</p>{" "}
          <p className="text-success font-bold ">{formData.amount} KAS</p>
        </div>
        <div className="flex items-center justify-between text-muted/50">
          <p>Counterparty (vendor)</p>{" "}
          <p className="text-white text-[10px] bg-muted/10 p-1 rounded-sm">
            {formData.vendor}
          </p>
        </div>
        <div className="flex items-center justify-between py-2 text-muted/50">
          <p>Network Fee (Est.)</p> <p className="text-white">0.0001 KAS</p>
        </div>
      </div>
    </div>
  );
}

export default Review;
