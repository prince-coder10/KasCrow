import React from "react";
import Button from "./Button";

interface InfoBoxProps {
  message: string;
  onClick: () => void;
}

function InfoBox({ message, onClick }: InfoBoxProps) {
  return (
    <div className="flex justify-center items-center">
      <p>{message}</p>
      <div>
        <Button>Close</Button>
      </div>
    </div>
  );
}

export default InfoBox;
