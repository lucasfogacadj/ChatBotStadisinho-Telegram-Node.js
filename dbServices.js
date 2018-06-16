const moment = require('moment')
const axios = require('axios')

const baseUrl = 'http://127.0.0.1:8000/api/trabalhos'
const usuUrl = 'http://127.0.0.1:8000/api/usuarios'


const getListaUsuarios = async() =>{
    const Url =`${usuUrl}?_sort=id`
    const result = await axios.get(Url)
    return result.data
}

const getUsuarios = async id =>{
    const resposta = await axios.get(`${usuUrl}/${id}`)
    console.log(resposta)
    return resposta.data
}

const addUsuario  = async (idUsuario, nomeUsuario, nickname) => {
    const res = await axios.post(`${usuUrl}`, {id: idUsuario, nome: nomeUsuario, username: nickname})
    return res.data
}


const getListaTrabalhos = async (data, idDoUsuario) => {
    const url = `${baseUrl}?_sort=dataEntrega,anotacoes&_order=asc`
    const result = await axios.get(url)
    const trabalhosNaoEntregues = item => item.dataConcluida === null
        && moment(item.dataEntrega).isSameOrBefore(data) && item.idUsuario == idDoUsuario
    return result.data.filter(trabalhosNaoEntregues)
}

const getTrabalho = async id =>{
    const resposta = await axios.get(`${baseUrl}/${id}`)
    return resposta.data
}

const getTrabalhos = async idDoUsuario =>{
    const resposta = await axios.get(`${baseUrl}?_sort=anotacoes&order=asc`)
    return resposta.data.filter(item => item.dataEntrega === null && item.dataConcluida === null && item.idUsuario == idDoUsuario)
}


const getTrabalhosConcluidas = async idDoUsuario =>{
    const resposta = await axios.get(`${baseUrl}?_sort=dataEntrega,descricao&order=asc`)
    return resposta.data.filter(item => item.dataConcluida !== null && item.idUsuario == idDoUsuario)
}

const addTrabalho = async (desc, idDoUsuario) => {
    const res = await axios.post(`${baseUrl}`, { titulo: desc, idUsuario: idDoUsuario, dataEntrega: null, dataConcluida: null, anotacoes: null })
    console.log(res)
    return res.data
}

const EntregarTrabalho = async id => {
    const trabalho = await getTrabalho(id)
    const resposta = await axios.put(`${baseUrl}/${id}`, { ...trabalho, dataConcluida: moment().format('YYYY-MM-DD') })
    return resposta.data
}

const excluirTrabalho = async id => {
    await axios.delete(`${baseUrl}/${id}`)
}


const atualizarDataTrabalho = async (idTrabalho, data) => {
    const trabalho = await getTrabalho(idTrabalho)
    const res = await axios.put(`${baseUrl}/${idTrabalho}`,
        { ...trabalho, dataEntrega: data.format('YYYY-MM-DD') })
    return res.data
}

const atualizarAnotacoesTrabalho = async (idTrabalho, ant) =>{
    const trabalho = await getTrabalho(idTrabalho)
    const resposta = await axios.put(`${baseUrl}/${idTrabalho}`,
    {...trabalho, anotacoes: ant})
    return resposta.data
}



module.exports={
    getListaUsuarios,
    getUsuarios,
    getTrabalho,
    getListaTrabalhos,
    getTrabalhos,
    getTrabalhosConcluidas,
    addUsuario,
    addTrabalho,
    excluirTrabalho,
    EntregarTrabalho,
    atualizarDataTrabalho,
    atualizarAnotacoesTrabalho,
}
