// Uber Types
export interface UberCardInfo {
  cardType: string;
  bin: string;
  last4: string;
  expiration: string;
}

export interface UberPaymentProfile {
  uuid: string;
  cardNumber: string;
  cardExpiration: string;
  cardType: string;
  cardBin: string;
}

export interface UberApiResponse {
  availablePaymentProfiles?: UberPaymentProfile[];
}

// Resy Types
export interface ResyPaymentMethod {
  id: number;
  exp_month: number;
  exp_year: number;
}

export interface ResyUserResponse {
  payment_methods?: ResyPaymentMethod[];
}

export interface ResyDepositInfo {
  fee: number | null;
  hasDeposit: boolean;
}

export interface ResyAvailabilityTemplate {
  deposit_fee?: number;
}

export interface ResySearchHit {
  id?: {
    resy: string;
  };
  availability?: {
    templates?: {
      [key: string]: ResyAvailabilityTemplate;
    };
  };
}

export interface ResySearchResponse {
  search?: {
    hits?: ResySearchHit[];
  };
}

// State Types
export interface AppState {
  amex: {
    processed: boolean;
  };
  uber: {
    cardInfo: Record<string, UberCardInfo>;
    dataProcessed: boolean;
    processedCardIds: Set<string>;
  };
  resy: {
    paymentInfo: ResyPaymentMethod[] | null;
    dataProcessed: boolean;
    venueDeposits: Map<number, ResyDepositInfo>;
  };
  resyWidget: {
    paymentInfo: ResyPaymentMethod[] | null;
    dataProcessed: boolean;
  };
}
