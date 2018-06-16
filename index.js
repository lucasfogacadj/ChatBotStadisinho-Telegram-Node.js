const env = require('../ChatBotStadinho - cópia/.env')
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const moment = require('moment')

const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')

const{finalDeSemana} = require('./diaServices')

const{
    getUsuarios, getTrabalho, getListaTrabalhos, getTrabalhos, getTrabalhosConcluidas, getListaUsuarios,
    addTrabalho, addUsuario, excluirTrabalho, EntregarTrabalho, atualizarDataTrabalho, atualizarAnotacoesTrabalho
} = require('./dbServices')

const bot = new Telegraf(env.token)

bot.start( async ctx  =>{
    const nome = ctx.update.message.from.first_name
    idUsuario = ctx.update.message.from.id
    nickname = ctx.update.message.from.username
    //console.log(idUsuario)
    //console.log(nickname)
    exibirUsuarioPorID(idUsuario, nome, nickname)
    await ctx.reply(`Olá, ${nome}!`)
    await ctx.replyWithPhoto('https://i.imgur.com/SyMCuVE.png')
    await ctx.reply(`Sou Stadizinho, estou aqui para para ajudar você a não se esquecer de entregar mais nenhum trabalho!`)
    await ctx.reply(`Escolha uma opcao`, tecladoOpcs)
})


const exibirUsuarioPorID = async (idUsuario, nome, nickname) =>{
    try {
        console.log("verificando...")
        const teste = await getUsuarios(idUsuario)
        if(teste.id == idUsuario){
            return console.log('Usuário encontrato no banco')
             }
        } catch (err) {
            console.log('Usuario não encontrado, adicionando.')
            return addUsuario(idUsuario, nome, nickname)
            }
    }


const formatarData = data =>
    data ? moment(data).format('DD/MM/YYYY') : ''

const exibirTrabalho = async (ctx, trabalhoId, novaMsg = false, idUsuario) => {
    const trabalho = await getTrabalho(trabalhoId)
    const entrega = trabalho.dataConcluida ?
        `\n<b>Entrege em:</b> ${formatarData(trabalho.dataConcluida)}` : ''
    const msg = `
        <b>${trabalho.titulo}</b>
        <b>Data de Entrega do trabalho:</b> ${formatarData(trabalho.dataEntrega)}${entrega}
        <b>Anotações:</b>\n${trabalho.anotacoes || ''}`

    if (novaMsg) {
        ctx.reply(msg, botoesTrabalhos(trabalhoId))
    } else {
        ctx.editMessageText(msg, botoesTrabalhos(trabalhoId))
    }
}

const botoesListaTrabalho = trabalhos => {
    const botoes = trabalhos.map(item => {
        const data = item.dataEntrega ?
            `${moment(item.dataEntrega).format('DD/MM/YYYY')} - ` : ''
        return [Markup.callbackButton(`${data}${item.titulo}`, `mostrar ${item.id}`)]
    })
    return Extra.markup(Markup.inlineKeyboard(botoes, { columns: 1 }))
}

const botoesTrabalhos = idTrabalho => Extra.HTML().markup(Markup.inlineKeyboard([
    Markup.callbackButton('✅', `concluir ${idTrabalho}`),
    Markup.callbackButton('📆', `setData ${idTrabalho}`),
    Markup.callbackButton('📝', `addNota ${idTrabalho}`),
    Markup.callbackButton('❌', `excluir ${idTrabalho}`),
], { columns: 4 }))

bot.hears([/^Trabalhos pra fazer$/i,/ˆtrabalho pra hoje$/,
     /Tem alguma coisa pendente/i,/ˆtrabalho pendente$/,
     /trabalhos pendentes/i, /trabalhos hoje/i, /tarefas pendentes/i,
    /tarefas pra hoje/i, /tarefas hoje/i, /tem algum trabalho pra fazer?/i,
    /Ver trabalhos pendentes/i, /tem algum trabalho pra hoje/i,
     /Mostrar trabalhos pendentes/i, /Mostrar trabalhos para entregar hoje/i], async ctx => {
    const trabalhos = await getListaTrabalhos(moment(), idUsuario)
    if(trabalhos.length == 0 || trabalhos == null ){
        ctx.reply('Parabéns não há nenhum trabalho pendente!')
    }else{
    ctx.reply(`Aqui está a seus trabalhos pendentes`, botoesListaTrabalho(trabalhos))
    }
})

bot.hears([/amanha/i, /tem alguma coisa para amanhã/i,
            /^trabalho pra amanhã$/i,
            /tem algum trabalho para amanhã/i, /tem alguma tarefa para amanhã/i,
            /preciso entregar algum trabalho para amanhã/i, /tem algo pra amanhã/i,
            /mostrar trabalhos que devem ser entregues amanhã/i, /Mostrar trabalhos para entregar amanhã/i], async ctx => {

    idUsuario = ctx.update.message.from.id
    const trabalhos = await getListaTrabalhos(moment().add({ day: 1 }), idUsuario)
    if(!trabalhos.length == 0 || trabalhos == null ){
        ctx.reply(`Estes são seus trabalhos para entregar até amanhã ou atrasados`, botoesListaTrabalho(trabalhos))
    }else{
        ctx.reply('Não há nenhum trabalho para entregar até amanhã ou atrasados')
    }
})

bot.hears([ /tem alguma coisa para essa semana/i, /^trabalho pra essa semana$/i,
    /mostrar trabalho pra entregar essa semana/i,
    /tem algum trabalho para essa semana/i, /tem alguma tarefa essa semana/i,
    /preciso entregar algum trabalho para essa semana/i,
    /tem algo pra essa semana/i, /mostrar trabalhos para entregar essa semana/i], async ctx => {
    idUsuario = ctx.update.message.from.id
    const trabalhos = await getListaTrabalhos(moment().add({ week: 1 }), idUsuario)
    console.log(trabalhos)
    if(!trabalhos.length == 0 || trabalhos == null ){
    ctx.reply(`Aqui está a seus trabalhos para entregar nessa semana`, botoesListaTrabalho(trabalhos))
    }else{
        ctx.reply('Não há nenhum trabalho para entregar semana que vem ou atrasados')
    }
})

bot.hears([/concluido/i, /^trabalhos entregues$/i,
            /me mostre todos meus trabalhos concluidos/i, /^trabalhos concluidos$/i, 
            /trabalhos feitos/i, /trabalhos que já fiz/i, /Mostrar trabalhos entregues/i,
            /mostrar trabalhos prontos/i,  /Quais os trabalhos concluidos/i], async ctx => {
    idUsuario = ctx.update.message.from.id
    const trabalhos = await getTrabalhosConcluidas(idUsuario)
    if(trabalhos.length == 0 || trabalhos == null ){
        ctx.reply('Opa ! não há nenhum trabalho concluido!')
    }else{
    ctx.reply(`Parabéns, esses são os trabalhos já você já entregou`, botoesListaTrabalho(trabalhos))
    }
})

bot.hears([/quais trabalhos sem data/i,/^trabalhos sem data$/i,
             /tem algum trabalhos sem data definida/i, /trabalho sem data para entrega/i,
            /quais trabalhos sem data, tem algum trabalho sem data/i], async ctx => {
    idUsuario = ctx.update.message.from.id
    console.log(idUsuario)
    const trabalhos = await getTrabalhos(idUsuario)
    ctx.reply(`Aqui estão os trabalhos que você não colocou data`, botoesListaTrabalho(trabalhos))
})


bot.action(/mostrar (.+)/, async ctx => {
    await exibirTrabalho(ctx, ctx.match[1])
})

bot.action(/concluir (.+)/, async ctx => {
    await EntregarTrabalho(ctx.match[1])
    await exibirTrabalho(ctx, ctx.match[1])
    await ctx.reply(`Trabalho Entregue`)
})

bot.action(/excluir (.+)/, async ctx => {
    await excluirTrabalho(ctx.match[1])
    await ctx.editMessageText(`Trabalho Deletado!`)
})

const tecladoDatas = Markup.keyboard([
    ['Hoje', 'Amanhã'],
    ['1 Semana', '1 Mês'],
]).resize().oneTime().extra()

const tecladoOpcs = Markup.keyboard([
    ['Adicionar novo trabalho'],
    ['Mostrar trabalhos para entregar hoje'],
    ['Mostrar trabalhos para entregar amanhã'],
    ['Mostrar trabalhos para entregar essa semana'],
    ['Mostrar trabalhos sem data para entregar'],
    ['Mostrar trabalhos entregues'],
    ['Tem aula hoje?']
]).resize().oneTime().extra()


let idTrabalho = null

const ScenaData = new Scene('data')

ScenaData.enter(ctx => {
    idTrabalho = ctx.match[1]
    ctx.reply(`Gostaria de definir alguma data?`, tecladoDatas)
})

ScenaData.leave(ctx => idTrabalho = null)

ScenaData.hears(/hoje/gi, async ctx => {
    const data = moment()
    handleData(ctx, data)
})

ScenaData.hears(/(Amanh[ãa])/gi, async ctx => {
    const data = moment().add({ days: 1 })
    handleData(ctx, data)
})

ScenaData.hears(/^(\d+) dias?$/gi, async ctx => {
    const data = moment().add({ days: ctx.match[1] })
    handleData(ctx, data)
})

ScenaData.hears(/^(\d+) semanas?/gi, async ctx => {
    const data = moment().add({ weeks: ctx.match[1] })
    handleData(ctx, data)
})

ScenaData.hears(/^(\d+) m[eê]s(es)?/gi, async ctx => {
    const data = moment().add({ months: ctx.match[1] })
    handleData(ctx, data)
})

ScenaData.hears(/(\d{2}\/\d{2}\/\d{4})/g, async ctx => {
    const data = moment(ctx.match[1], 'DD/MM/YYYY')
    handleData(ctx, data)
})

const handleData = async (ctx, data) => {
    await atualizarDataTrabalho(idTrabalho, data)
    await ctx.reply(`Data atualizada!`)
    await exibirTrabalho(ctx, idTrabalho, true)
    ctx.scene.leave()
}


ScenaData.on('message', ctx =>
    ctx.reply(`Digite nesse padrão\ndd/MM/YYYY\nX dias\nX semanas\nX meses`))


const ScenaAnotacao = new Scene('anotacoes')

ScenaAnotacao.enter(ctx => {
    idTrabalho = ctx.match[1]
    ctx.reply(`Já pode adicionar suas anotações...`)
})

ScenaAnotacao.leave(ctx => idTrabalho = null)

ScenaAnotacao.on('text', async ctx => {
    const trabalho = await getTrabalho(idTrabalho)
    const novoTexto = ctx.update.message.text
    const obs = trabalho.anotacoes ?
        trabalho.anotacoes + '\n---\n' + novoTexto : novoTexto
    const res = await atualizarAnotacoesTrabalho(idTrabalho, obs)
    await ctx.reply(`Anotação adicionada!`)
    await exibirTrabalho(ctx, idTrabalho, true)
    ctx.scene.leave()
})

ScenaAnotacao.on('message', ctx => ctx.reply(`Apenas anotações em texto são aceitas`))

const ScenaInserir = new Scene('inserir')

ScenaInserir.enter(ctx =>{
    ctx.reply('Pode digitar o titulo do trabalho')
    ScenaInserir.on('text', async ctx => {
    try {
        idUsuario = ctx.update.message.from.id
        const trabalho = await addTrabalho(ctx.update.message.text, idUsuario)
        await ctx.reply('Agora você pode editar a data de entrega e colocar a descrição')
        await exibirTrabalho(ctx, trabalho.id, truee)
        ctx.scene.leave()
    } catch (err) {
        console.log(err)
            }
        })
})

const stage = new Stage([ScenaData, ScenaAnotacao, ScenaInserir])
bot.use(session())
bot.use(stage.middleware())

bot.action(/setData (.+)/, Stage.enter('data'))
bot.action(/addNota (.+)/, Stage.enter('anotacoes'))
bot.hears('Adicionar novo trabalho', Stage.enter('inserir'))

bot.hears(/tem aula hoje/i, ctx =>{
    console.log(finalDeSemana())
    if(finalDeSemana()==false){
        ctx.reply('Tem aula sim manjão!')
    }else{
        ctx.reply('Não tem aula não maluco!')
    }
})

bot.on('message', ctx=>{
    ctx.reply('Não intendi... escolha uma opção', tecladoOpcs)
})

bot.startPolling()
