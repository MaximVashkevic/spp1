function getGraphData(symbol) {
    let initialDate = new Date()
    initialDate.setDate(-30)
    return {
        initialDate: initialDate.toISOString(),
        data: getRandomData(initialDate, 30)
    }
}

function getStockInfo(symbol) {
    return {
        symbol: "AAPL",
        companyName: "Apple Inc.",
        isUp: true,
        price: "128.33$",
        totalCash: '12B',
        totalDebt: '10B',
        operatingCash: '10B'
    }
}

const luxon = require('luxon')

function getComments(symbol)
{
    return Array(10).fill().map((_, i) => { return {
        author: "Michael",
        time: luxon.DateTime.now().toLocaleString(luxon.DateTime.DATETIME_MED),
        text: `My comment${i}`}
    })
}

function randomNumber(min, max) {
	return Math.random() * (max - min) + min;
}


function randomBar(date, lastClose) {
	var open = +randomNumber(lastClose * 0.95, lastClose * 1.05).toFixed(2);
	var close = +randomNumber(open * 0.95, open * 1.05).toFixed(2);
	var high = +randomNumber(Math.max(open, close), Math.max(open, close) * 1.1).toFixed(2);
	var low = +randomNumber(Math.min(open, close) * 0.9, Math.min(open, close)).toFixed(2);
	return {
		x: date.valueOf(),
		o: open,
		h: high,
		l: low,
		c: close
	};

}

function getRandomData(date, count) {
	var date = luxon.DateTime.fromJSDate(date)
	var data = [randomBar(date, 30)];
	while (data.length < count) {
		date = date.plus({days: 1});
		if (date.weekday <= 5) {
			data.push(randomBar(date, data[data.length - 1].c));
		}
	}
	return data;
}

module.exports = {
    getGraphData,
    getStockInfo,
    getComments
}