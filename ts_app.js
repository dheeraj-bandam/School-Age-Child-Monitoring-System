'use strict';

const http = require('http');
var axios = require("axios");

let urls = [];


const getUrls = async () => {
    // const inputUrls = ['http://[aaaa::c30c:0:0:1]/', 'http://[aaab::c30c:0:0:6]/'];
		const inputUrls = ['http://[aaaa::c30c:0:0:1]/', 'http://[aaab::c30c:0:0:2]/','http://[aaac::c30c:0:0:3]/','http://[aaad::c30c:0:0:4]/'];
    urls = [];
    try {
        for (const inputUrl of inputUrls) {
            const response = await fetch(inputUrl);
            if (!response.ok) {
        		    throw new Error(`HTTP error! Status: ${response.status}`);
        		}

        		const result = await response.text();
        		const regex = /([a-fA-F0-9:]+(?=\/))/g;
						const matches = result.match(regex);

            if (matches) {
                const addressUrls = matches.map((address) => `http://[${address}]/`);
                urls.push(...addressUrls);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
};

function sendData(latitude,longitude) { //sending data to dashboard
  const payload = [
    {
      "latitude" : latitude,
      "longitude" : longitude
    },
  ];

  var config = {
    method: "post",
    url: 'https://industrial.api.ubidots.com/api/v1.6/devices/device1/_/bulk/values',
    headers: {
      "X-Auth-Token": "BBUS-02GpVkZFL9GQM44GA7O03i9WRc022R",
      "Content-Type": "application/json",
    },
    data: payload,
  };
  axios(config)
    .then(function (response) {
      console.log("Data sent to Ubidot:", JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log("Error:", error);
    });
}

function sendDataLocal(latitude,longitude,index) { //sending data to local database to recover 
  const payload = [
    {
    	"index" : index,
      "latitude" : latitude,
      "longitude" : longitude
    },
  ];

  var config = {
    method: "post",
    url: 'http://localhost:3000/data',
    headers: {
      "Content-Type": "application/json",
    },
    data: payload,
  };
  axios(config)
    .then(function (response) {
      console.log("Data sent to Database:", JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log("Error:", error);
    });
}

const getData = async() => { //getting data from database 
  var config = {
    method: "get",
    url: 'http://localhost:3000/data',
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.log("Error:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = process.env.CHANNEL_NAME || 'mychannel';  // write mychannel name 
const chaincodeName = process.env.CHAINCODE_NAME || 'basic';  // write my chaincode name 

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'javascriptAppUser';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);

			

			let row_id = 111; // Initialize row_id
			let currentIndex = 0;

			const initLedger = async() => {
				const data  = await getData();
				console.log("fetched data:" , data);
				if(data.length !== 0){
					console.log('pushing previous data')

					const promises = data.map((e) => {
						row_id++;
						console.log('e : ', e)
						const index = e[0].index
      			const Latitude = e[0].latitude
      			const Longitude = e[0].longitude
      			console.log(index,Latitude,Longitude);
						const currentTime = new Date().toISOString();
						return contract.submitTransaction('CreateAsset', row_id.toString(), index.toString(), Latitude.toString(), Longitude.toString(), currentTime);
					})

					const results = await Promise.all(promises);
					console.log('all transactions are submitted from db');
					console.log(results);
				}
			}

			async function fetchAndSubmitData(url, index) {
			  http.get(url, async (response) => {
			    try {
			      let data = 	'';

			      response.on('data', (chunk) => {
				data += chunk;
			      });

			      response.on('end', async () => {
				if (response.statusCode === 200) {
				  const jsonData = JSON.parse(data);
				  const Latitude = jsonData.rsc.Latitude.value;
				  const Longitude = jsonData.rsc.Longitude.value;
				  sendData(Latitude,Longitude);
				  sendDataLocal(Latitude,Longitude,index);
          			  const currentTime = new Date().toISOString();
				  console.log('\n--> Submit Transaction: CreateAsset, creates a new asset with RID, SID, Longitude, Latitude, time');
				  const result = await contract.submitTransaction('CreateAsset', row_id.toString(), index.toString(), Latitude.toString(), Longitude.toString(), currentTime);
				  console.log('*** Result: committed');
				  if (`${result}` !== '') {
				    console.log(`*** Result: ${prettyJSONString(result.toString())}`);
				  }
				  
				  // Increment row_id for the next call
				  row_id++;
				} else {
				  console.error('HTTP request failed with status code:', response.statusCode);
				}
			      });
			    } catch (error) {
			      console.error('Error processing HTTP response:', error);
			    }
			  }).on('error', (error) => {
			    console.error('Error making HTTP request:', error);
			  });
			}

      await initLedger().then(() => {
      	row_id++;
      	fetchAndSubmitData(urls[currentIndex], currentIndex);
                       
				setInterval(() => {
					getUrls().then(() => {
						console.log(urls);
						currentIndex = (currentIndex + 1) % urls.length; 
				  	fetchAndSubmitData(urls[currentIndex], currentIndex);
					})
				}, 10000);// Fetch and submit data every 10 seconds
      })

			// ... (rest of your code)




							
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
		process.exit(1);
	}
}

getUrls().then(() => {
	console.log(urls);
	main();
})