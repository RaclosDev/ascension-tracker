import React from 'react';

const parseSafeFloat = (val: any, fallback = 0) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

export interface MacroForm {
  macroStrategy: string;
  kcal: number | string;
  customProteinGrams: number | string;
  customFatGrams: number | string;
  customCarbsGrams: number | string;
  customProteinPct: number | string;
  customFatPct: number | string;
  customCarbsPct: number | string;
  startWeight: number | string;
  goalWeight: number | string;
  [key: string]: any;
}

interface MacroConfiguratorProps {
  form: MacroForm;
  setForm: (form: MacroForm) => void;
}

export default function MacroConfigurator({ form, setForm }: MacroConfiguratorProps) {
  return (
    <div>
      
    </div>
  );
}
