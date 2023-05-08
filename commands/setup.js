const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { setupChannelsRotation } = require("../utils/enmapUtils");
const { day } = require("../init");

async function addSetupCommand(slashCommand) {
    slashCommand.addSubcommand((subcommand) =>
    subcommand
        .setName("channels_rotation")
        .setDescription("Définir une catégorie pour mettre certains salons gratuitement temporairement.")
		.addChannelOption((channel) =>
			channel
				.setName("category")
				.setDescription(
					"Entrez la catégorie avec les channels payants."
				)
				.setRequired(true)
		)
		.addChannelOption((channel) =>
			channel
				.setName("infos")
				.setDescription(
					"Entrez le channel d'infos."
				)
				.setRequired(true)
		)
		.addChannelOption((channel) =>
			channel
				.setName("free_category")
				.setDescription(
					"Entrez la catégorie où sont les channels temporaires gratuits si elle existe sinon elle sera créé."
				)
				.setRequired(false)
		)
	);
}

/* ----------------------------------------------- */
/* FUNCTIONS                                       */
/* ----------------------------------------------- */
/**
 * Fonction appelé quand la commande est 'setup'
 * @param {CommandInteraction} interaction L'interaction généré par l'exécution de la commande.
 */
async function execute(interaction) {
    if (interaction.options._subcommand === "channels_rotation") {

		// Récupération des options
		const category = interaction.options.getChannel("category");
		const freeCategory = interaction.options.getChannel("free_category");
		const infos = interaction.options.getChannel("infos");

		if(infos.type !== ChannelType.GuildText) {
			await interaction.reply({
				content: `Le channel d'infos doit être un channel textuel !`,
				ephemeral: true,
			});
			return;
		}

		// Vérification des types
		if(category.type === ChannelType.GuildCategory) {

			// Récupération de la catégorie des salons gratuits si elle existe sinon création
			if(freeCategory !== null && freeCategory.type === ChannelType.GuildCategory) {
				// Ajout de la catégorie dans la base de données
				setupChannelsRotation.set(interaction.guild.id, {categoryId: category.id, freeCategoryId: freeCategory.id, datetime: Date.now() + day * 7, infosId: infos.id});

				// Réponse à l'interaction
				await interaction.reply({
					content: `Catégorie <#${category.id}> défini comme catégorie des salons payants ! Catégorie <#${freeCategory.id}> créé pour les salons gratuits !`,
					ephemeral: true,
				});
			} else {

				// Création de la catégorie
				const freeCategory = await interaction.guild.channels.create({
					name: "Salons gratuits cette semaine",
					type: ChannelType.GuildCategory,
					position: category.position + 1,
					permissionOverwrites: [
						{
							id: interaction.guild.roles.everyone.id,
							allow: [PermissionFlagsBits.ViewChannel],
						},
					],
				});
				
				// Ajout de la catégorie dans la base de données
				setupChannelsRotation.set(interaction.guild.id, {categoryId: category.id, freeCategoryId: freeCategory.id, datetime: Date.now(), infosId: infos.id});
				
				// Réponse à l'interaction
				await interaction.reply({
					content: `Catégorie <#${category.id}> défini comme catégorie des salons payants ! Catégorie <#${freeCategory.id}> créé pour les salons gratuits !`,
					ephemeral: true,
				});
			}

		// Si le channel fourni n'est pas une catégorie
		} else {
			await interaction.reply({
				content: `La catégorie <#${category.id}> n'est pas une catégorie !`,
				ephemeral: true,
			});
		}
    }
}

module.exports = {
    addSetupCommand,
    execute,
};
