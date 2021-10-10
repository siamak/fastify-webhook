import { FastifyInstance, FastifyReply, FastifyRequest, FastifyServerOptions } from "fastify";
import { LinearClient } from "bybit-api";
import superagent from "superagent";
import dotenv from "dotenv";
import { RouteGenericQuery } from "./interface";

dotenv.config();

const { API_KEY, PRIVATE_KEY, TELEGRAM_BOT, TELEGRAM_CHAT_ID } = process.env;

async function sendMessage(text: string) {
	const opts = {
		url: `https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`,
		body: {
			chat_id: TELEGRAM_CHAT_ID,
			text,
			parse_mode: "markdown",
		},
		headers: {
			"Content-Type": "application/json",
		},
	};

	const res = await superagent.post(opts.url).send(opts.body);

	return res;
}

function capitalizeFirstLetter(string: string) {
	return string[0].toUpperCase() + string.slice(1);
}

const useLivenet = true;

const client = new LinearClient(
	API_KEY,
	PRIVATE_KEY,

	// optional, uses testnet by default. Set to 'true' to use livenet.
	useLivenet

	// restClientOptions,
	// requestLibraryOptions
);

export default async function (instance: FastifyInstance, opts: FastifyServerOptions, done: any) {
	instance.post("/bybit", async (req: FastifyRequest<RouteGenericQuery>, res: FastifyReply) => {
		const { symbol } = req.query;
		const { strategy, comment, exchange: _ecx } = req.body;
		const side = capitalizeFirstLetter(strategy.order_action);
		const qty = Number(strategy.order_contracts);
		const reduceOnly = comment.includes("Close");

		console.log({ symbol });

		try {
			const order = await client.placeActiveOrder({
				symbol,
				side,
				order_type: "Market",
				qty,
				reduce_only: reduceOnly,
				close_on_trigger: reduceOnly,
				time_in_force: "GoodTillCancel",
			});

			console.log({ order });

			await sendMessage(`*${symbol}*\n${comment}\n*${qty}* — ${side}`);
			await sendMessage(`✅ Took on *${_ecx}* — *${side}* — *${symbol}* – QTY: *${qty}*`);

			res.code(200).header("Content-Type", "application/json; charset=utf-8").send(order);
		} catch (error: any) {
			console.dir(error);
			await sendMessage(error.message);
			res.status(400).send(error);
		}
	});

	instance.get("/ping", async (req: FastifyRequest<RouteGenericQuery>, res: FastifyReply) => {
		res.status(200).send({
			message: "pong",
		});
	});

	instance.post("/print", async (req: FastifyRequest<RouteGenericQuery>, res: FastifyReply) => {
		const { symbol } = req.query;
		const { strategy, comment, exchange: _ecx } = req.body;
		const side = capitalizeFirstLetter(strategy.order_action);
		const qty = Number(strategy.order_contracts);
		const reduceOnly = comment.includes("Close");

		await sendMessage(`${JSON.stringify({ strategy, comment, _ecx, symbol, side, reduceOnly }, null, 2)}`);
		res.status(200).send({
			message: "Print",
		});
	});

	done();
}
