/**
 * @author Lothaire Guée
 * @description
 *		Handler for the 'ready' event.
 */


const { setupChannelsRotation } = require("../utils/enmapUtils");
const { numberOfChannelsToSelect, day } = require("../init");

/* ----------------------------------------------- */
/* FUNCTIONS                                       */
/* ----------------------------------------------- */
/**
 * Event called when the bot is ready after the connection to the api.
 * @param {Client} client The client that emitted the event.
 */
async function execute( client ) {
	setChannels(client);
	setInterval(async () => {
		setChannels(client);
	}, day / 2);
}

async function setChannels(client) {
	const results = await setupChannelsRotation.fetchEverything()
	if(results === undefined) return;
	for (const [key, value] of results) {
		if(value.datetime < Date.now()){
			await getRandomChannelsFromCategory(value.categoryId, value.freeCategoryId, client);
			await setupChannelsRotation.update(key, { datetime: Date.now() + day * 7 });
			const infos = await client.channels.fetch(value.infosId);
			const categoryFree = await client.channels.fetch(value.freeCategoryId);
			let channels = "";
			for (const channel of categoryFree.children.cache) {
				channels += `<#${channel[1].id}> `;
			}
			await infos.send(`Les salons gratuits de la semaine ont été changés !\nLes channels gratuits sont désormais : ${channels}`);
		}
	}
}

async function getRandomChannelsFromCategory( categoryPayId, categoryFreeId, client ){
	const categoryFree = await client.channels.fetch(categoryFreeId);
	
	// Prendre tous les channels de la catégorie free et les mettre dans la catégorie pay	
	for (const channel of categoryFree.children.cache) {
		await channel[1].setParent(categoryPayId);
	}

	// Prendre 5 channels au hasard et les mettre dans la catégorie free
	const categoryPay = await client.channels.fetch(categoryPayId);
	const channelsPay = await categoryPay.children.cache;
	const randomChannels = await selectRandomChannels(channelsPay, numberOfChannelsToSelect);
	for (let i = 0; i < randomChannels.length; i++) {
		const channelToSetFree = await channelsPay.get(randomChannels[i].id);
		await channelToSetFree.setParent(categoryFreeId);
	}
}

async function selectRandomChannels(channels, numberOfChannelsToSelect){
	const randomChannels = [];
	const tempChannels = await channels.clone();
	for (let i = 0; i < numberOfChannelsToSelect; i++) {
		const randomChannel = await tempChannels.random();
		randomChannels.push(randomChannel);
		await tempChannels.delete(randomChannel.id);
	}
	return randomChannels;
}
		
 
/* ----------------------------------------------- */
/* MODULE EXPORTS                                  */
/* ----------------------------------------------- */
module.exports = {
	name: "ready",
	once : true,
	execute
}