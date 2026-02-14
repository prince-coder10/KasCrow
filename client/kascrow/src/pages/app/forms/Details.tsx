import React from "react";

interface Props {
  formData: {
    title: string;
    amount: string;
    vendor: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      title: string;
      amount: string;
      vendor: string;
    }>
  >;
}

function Details({ formData, setFormData }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form className="border-b border-muted/20 pb-10 flex flex-col gap-5">
      <div>
        <label
          htmlFor="title"
          className="text-[12px] md:text-sm font-medium text-muted"
        >
          Deal Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Selling level 80 Account"
          className="w-full bg-bg-base border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
        />
      </div>

      <div>
        <label
          htmlFor="amount"
          className="text-[12px] md:text-sm font-medium text-muted"
        >
          Amount (KAS)
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          className="w-full bg-bg-base border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
        />
      </div>

      <div>
        <label
          htmlFor="vendor"
          className="text-[12px] md:text-sm font-medium text-muted"
        >
          Counterparty Address
        </label>
        <input
          type="text"
          id="vendor"
          name="vendor"
          value={formData.vendor}
          onChange={handleChange}
          placeholder="kaspa:q..."
          className="w-full bg-bg-base border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
        />
      </div>
    </form>
  );
}

export default Details;
