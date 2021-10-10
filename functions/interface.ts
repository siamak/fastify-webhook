export interface IBodyRequest {
	passphase: string;
	time: string;
	exchange: string;
	ticker: string;
	comment: string;
	bar: Bar;
	strategy: Strategy;
}

export interface Bar {
	open: string;
	high: string;
	low: string;
	close: string;
	volume: string;
}

export interface Strategy {
	position_size: string;
	order_action: string;
	order_contracts: string;
	order_price: string;
	order_id: string;
	market_position: string;
	market_size_position: string;
	prev_market_position: string;
	prev_market_position_size: string;
}

export interface IQueryString {
	symbol: string;
}

export interface RouteGenericQuery {
	Querystring: IQueryString;
	Body: IBodyRequest;
}
