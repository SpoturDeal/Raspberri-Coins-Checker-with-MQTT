/* NodeJs Script to retrieve the altcoin prices from bitvavo
 * The values are send by mqtt in json format i.e. btc = {"num":"1.30000002","amm":"38032","pf":49441.6000003}
 * the sendTopic is 'coins/btc' or coins/<your coin>
 * num is the number of coints you have  (LINE 25 in this code)
 * amm is the value of the coin against your currency (LINE 26 in this code)
 * pf  is the portfolio value for the coin in your currency
 *
 * Version: 1.21.0
 * Date: 2022-01-16
 *
 * You need a Bitvavo account and request an api keys
 */
 
// set the required modules
let mqtt=require('mqtt');

// credentials
const MQTT_USER = '<YOUR MQTT USER>'
const MQTT_PASW = '<YOUR MQTT_PASSWORD>'
const MQTT_IP = '192.168.1.xxx'
const BITVAVO_APIKEY = '<BITVAVO_APIKEY>'
const BITVAVO_SECRET = '<BITVAVO_SECRET>'

// constant variables
const COINS = ['XRP','BTC']
const CURRENCY = 'EUR'
const TIME_INTERVAL = 60000  // 60 seconds

// options to connect to MQTT server
const options = {
	clientId:"balancePi",
	username:MQTT_USER,
	password:MQTT_PASW,
	clean:true
	}
	
const showLog = false;

// options for message published by mqtt	
const optionsMqtt={	retain:true,
					qos:1}

// bitvavo module and options 
const bitvavo = require('bitvavo')().options({
  APIKEY: BITVAVO_APIKEY,
  APISECRET: BITVAVO_SECRET,
  ACCESSWINDOW: 10000,
  RESTURL: 'https://api.bitvavo.com/v2',
  WSURL: 'wss://ws.bitvavo.com/v2/',
  DEBUGGING: false
})

// set the mqtt client and connect
let client = mqtt.connect(`mqtt://${MQTT_IP}`,options)

// show message if mqtt is connected
client.on("connect",function(){	

  // only errors are shown if showLog is set to false
  console.log("connected flag  " + client.connected);
})

//handle errors
client.on("error",function(error){
	
  // only errors are shown if showLog is set to false	
  console.log("Can't connect" + error)
  
  // exit this process
  process.exit(1)
});

//publish the message
function publish(topic,msg,options){
   if (showLog === true){	
      console.log("Publishing",msg);
   }
   // check first if connected
   if (client.connected == true){
      client.publish(topic,msg,options);
   }
}

// get the data you want from bitvavo
const getCoins =()=>{
	
	// set the objects to 0
	let altCoin = {}
	let altValue = {}
	let portfolio = []
	
	// first the number of xrp owned  Bitvavo Rate limiting weight: 5.
	bitvavo.balance({}, (error, response) => {
		if (error == null) {
			
			// filter out the coins that you own 
			// filter is a bit overkill if there are only a few coins but the code is easier two read
			COINS.forEach(item => {
			  let stockOwn = response.filter(entry => entry.symbol == item)
			  altCoin[item]=stockOwn[0].available
			})
				
			
			// when we have the first data then the value of the xrp/btc from the ticker
			// Bitvavo Rate limiting weight: 1.
			bitvavo.tickerPrice({}, (error, response) => {
				if (error === null) {
					
					// filter out the coins that you own 
					// here filter makes more sense because it might be a large array with objects
					COINS.forEach(item => {
						let stockPrice = response.filter(entry => entry.market == `${item}-${CURRENCY}`)
					    altValue[item]=stockPrice[0].price
					})	
										
					COINS.forEach(item => {
						// calculate the value of each coin to currency
						let owning = altCoin[item] * altValue[item]
					    // Publish with MQTT
					    publish(`bitvavo/${item.toLowerCase()}`,JSON.stringify({num:altCoin[item],amm:altValue[item] ,pf:owning}),optionsMqtt)
						portfolio.push(owning)
					})	
					
					// get the total op the altcoins
					const total = portfolio.reduce((a, b) => a + b, 0);
					
					// publish the total portfolio as well
					publish('bitvavo/total',total.toString(),optionsMqtt)
				} else {
					
					// only errors are shown if showLog is set to false
					console.log(error)
				}
			})  // end tickerPrice
			
		} else {
			
			// only errors are shown if showLog is set to false
			console.log(error)
		}
	}) // end balance		
}

// get the initial values
getCoins()

// and repeat every 60 seconds  (this way you use Rate limit weight: 1440 * (1 + 5) = 8640 per day)
// not within 10 seconds
let timer_id=setInterval(function(){
	getCoins()
}, TIME_INTERVAL < 10000 ? 10000 : TIME_INTERVAL)
