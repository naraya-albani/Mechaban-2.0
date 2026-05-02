export const formatNominal = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value);
