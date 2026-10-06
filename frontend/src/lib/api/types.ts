export interface Option {
  label: string;
  value: string;
}

export interface SelectielijstklasseOption extends Option {
  extraData: {
    bewaartermijn: string | null;
    resultaattypen: Option[];
  };
}
