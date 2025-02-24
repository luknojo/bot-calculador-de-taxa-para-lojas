const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('calcrobux')
        .setDescription('Calcula o valor do Robux com ou sem taxa')
        .addIntegerOption(option =>
            option.setName('valor')
                .setDescription('Quantidade de Robux')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Escolha entre "taxado" ou "semtaxa"')
                .setRequired(true)
                .addChoices(
                    { name: 'Taxado', value: 'taxado' },
                    { name: 'Sem taxa', value: 'semtaxa' }
                )
        ),

    new SlashCommandBuilder()
        .setName('calctokens')
        .setDescription('Calcula o valor em Tokens')
        .addIntegerOption(option =>
            option.setName('valor')
                .setDescription('Quantidade de Tokens')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('ajustar')
        .setDescription('Ajusta os preços dos valores')
        .addStringOption(option =>
            option.setName('categoria')
                .setDescription('Escolha a categoria')
                .setRequired(true)
                .addChoices(
                    { name: 'Robux Taxado', value: 'robuxtaxado' },
                    { name: 'Robux Sem Taxa', value: 'robuxsemtaxa' },
                    { name: 'Tokens', value: 'tokens' }
                )
        )
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantidade a ser ajustada')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option.setName('valor')
                .setDescription('Novo valor em BRL')
                .setRequired(true)
        )
];

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        console.log('🔄 Registrando comandos...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands.map(cmd => cmd.toJSON()) });
        console.log('✅ Comandos registrados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
}

let precoTaxado = { 100: 3.75 };
let precoSemTaxa = { 100: 2.80 };
let precoTokens = { 50: 1.15 };

client.once('ready', async () => {
    console.log(`✅ Bot logado como ${client.user.tag}`);
    await registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'calcrobux') {
        const valor = interaction.options.getInteger('valor');
        const tipo = interaction.options.getString('tipo');

        let tabela = tipo === 'taxado' ? precoTaxado : precoSemTaxa;
        const referencia = Object.keys(tabela).reverse().find(key => valor >= key);
        
        if (!referencia) {
            await interaction.reply('❌ Valor não encontrado na tabela de referência.');
            return;
        }

        const precoPorRobux = tabela[referencia] / referencia;
        const resultado = (valor * precoPorRobux).toFixed(2);

        await interaction.reply(`💰 ${tipo === 'taxado' ? 'Após' : 'Antes'} da taxa: **${resultado} BRL**`);
    }

    if (interaction.commandName === 'calctokens') {
        const valor = interaction.options.getInteger('valor');
        const referencia = Object.keys(precoTokens).reverse().find(key => valor >= key);
        
        if (!referencia) {
            await interaction.reply('❌ Valor não encontrado na tabela de referência.');
            return;
        }

        const precoPorToken = precoTokens[referencia] / referencia;
        const resultado = (valor * precoPorToken).toFixed(2);

        await interaction.reply(`🪙 Equivalente em Tokens: **${resultado} BRL**`);
    }

    if (interaction.commandName === 'ajustar') {
        const categoria = interaction.options.getString('categoria');
        const quantidade = interaction.options.getInteger('quantidade');
        const novoValor = interaction.options.getNumber('valor');

        let tabela;
        if (categoria === 'robuxtaxado') tabela = precoTaxado;
        else if (categoria === 'robuxsemtaxa') tabela = precoSemTaxa;
        else if (categoria === 'tokens') tabela = precoTokens;
        else {
            await interaction.reply('❌ Categoria inválida.');
            return;
        }

        tabela[quantidade] = novoValor;
        await interaction.reply(`✅ Preço de **${quantidade} ${categoria === 'tokens' ? 'Tokens' : 'Robux'}** ajustado para **${novoValor} BRL**.`);
    }
});

client.login(process.env.TOKEN);
