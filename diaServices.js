const moment = require('moment')

const finalDeSemana = ()=>{
    const data = moment().day()
    if(data==6||data==0){
        return true
    }else{
        return false
    }
}

module.exports={
    finalDeSemana,
}
