export type ManualFoodValues = {
  name: string;
  brand: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
};

export function updateManualFoodForm(
  manualForm: ManualFoodValues,
  field: string,
  value: string,
): ManualFoodValues {
  const newForm = { ...manualForm, [field]: value };
  if (['protein', 'carbs', 'fat'].includes(field)) {
    const p = parseFloat(newForm.protein) || 0;
    const c = parseFloat(newForm.carbs) || 0;
    const f = parseFloat(newForm.fat) || 0;
    if (newForm.protein || newForm.carbs || newForm.fat) {
      newForm.kcal = (Math.round((p * 4 + c * 4 + f * 9) * 10) / 10).toString();
    } else {
      newForm.kcal = '';
    }
  }
  return newForm;
}
