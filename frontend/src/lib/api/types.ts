export interface Option {
  label: string;
  value: string;
}

export interface SelectielijstklasseOption extends Option {
  extraData: {
    waardering: "blijvend_bewaren" | "vernietigen";
    bewaartermijn: string | null;
    resultaattypen: Option[];
  };
}
