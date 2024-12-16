
let stream,bidPrice,askPrice,midPrice,liveChart,hist,epoch
let count = 0
let showSide = "short"
const priceData = []
const shapes = [
    {type:'line',markerType:'none'},
    {type:'line',markerType:'none'},
    {type:'line',markerType:'none'},
    {type:'line',markerType:'none'},
    {type:'line',markerType:'none'},
    {type:'line',markerType:'none'}
    ]

Promise.all([
    fetch(`https://stream-fxtrade.oanda.com/v3/accounts/${accNo}/pricing/stream?instruments=NATGAS_USD`,{headers : {'Authorization':`Bearer ${apiKey}`,'Accept-Datetime-Format':"UNIX"}})
    .then((response)=>{
        stream = response.body.pipeThrough(new TextDecoderStream()).getReader()
    }),
    fetch(`https://api-fxtrade.oanda.com/v3/accounts/${accNo}/instruments/NATGAS_USD/candles?count=5000&granularity=M2`,{headers : {'Authorization':`Bearer ${apiKey}`,'Accept-Datetime-Format':"UNIX"}})
    .then((response) => {
        return response.json()
    })
    .then ((jsonObj)=>{
        hist = jsonObj.candles
    })
])
.then(()=>{
    let len = hist.length
    
    for (let i = 0;i<len-1;i++){
        let thisDate = new Date(Number(hist[i].time*1000));
        let hh = String(thisDate.getHours()).padStart(2,'0');
        let mm = String(thisDate.getMinutes()).padStart(2,'0');
        let ss = String(thisDate.getSeconds()).padStart(2,'0');
        priceData.push({x:120*(i+1-len),y:Number(hist[i].mid.o),label:`${hh}:${mm}:${ss}`})
    }
    epoch = hist[len-1].time
    let thisDate = new Date(Number(hist[len-1].time*1000));
    let hh = String(thisDate.getHours()).padStart(2,'0');
    let mm = String(thisDate.getMinutes()).padStart(2,'0');
    let ss = String(thisDate.getSeconds()).padStart(2,'0');
    priceData.push({x:0,y:Number(hist[len-1].mid.o),label:`${hh}:${mm}:${ss}`})
    liveChart.options.axisX.stripLines =[{
        value:0,
        label:`epoch = ${hh}:${mm}:${ss}`,
        labelFontColor:'grey',
        color:'grey'
    }]

    streamRecursor()
})  

function streamRecursor(){
    stream.read().
    then((chunk)=>{
        try {
            let parsed = JSON.parse(chunk.value)
            if (parsed.type == 'PRICE'){
                bidPrice = Number(parsed.closeoutBid)
                askPrice = Number(parsed.closeoutAsk)
                midPrice = (bidPrice+askPrice)/2
            }
            let thisDate = new Date(parsed.time*1000)
            document.querySelector('#midPrice').innerHTML = `Mid Price: ${midPrice.toFixed(5)}` 
            document.querySelectorAll('.bid').forEach((e)=>{e.innerHTML = bidPrice.toFixed(5)})
            document.querySelectorAll('.ask').forEach((e)=>{e.innerHTML = askPrice.toFixed(5)})
            document.querySelector('#sPL').innerHTML = Number(document.querySelector('#sUnits').innerHTML)* (Number(document.querySelector('#sAP').innerHTML)-askPrice)
            document.querySelector('#lPL').innerHTML = Number(document.querySelector('#lUnits').innerHTML)* (bidPrice-Number(document.querySelector('#lAP').innerHTML))
            document.querySelector('#priceTime').innerHTML=`(updated at ${thisDate.toLocaleString('en-GB')})`
            priceData[priceData.length-1].markerSize = 1;
            priceData[priceData.length-1].markerColor = 'orange';
            priceData.push({x:Number(parsed.time)-epoch,y:midPrice,markerSize:6,markerColor:'red'})
            //liveChart.options.axisX.viewportMinimum = parsed.time - epoch - 82800
            //liveChart.options.axisX.viewportMaximum = parsed.time -epoch + 3600
            liveChart.render()
        } catch (error) {
        }
                
        
    }).then(()=>{
        setTimeout(streamRecursor,300)
    })
    
}
async function updateAcc(){
    fetch(`https://api-fxtrade.oanda.com/v3/accounts/${accNo}/positions/NATGAS_USD`,{headers : {'Authorization':`Bearer ${apiKey}`}})
    .then((response)=>{
        if (response.status === 200){
            return response.json()
        }
        return false
        
    })
    .then((jsonObj)=>{
        if (jsonObj){
            let pos = jsonObj.position
            document.querySelector('#sUnits').innerHTML = -Number(pos.short.units)
            document.querySelector('#lUnits').innerHTML = pos.long.units
            document.querySelector('#sAP').innerHTML = (pos.short.averagePrice)
            document.querySelector('#lAP').innerHTML = (pos.long.averagePrice)

        }
    })
}

updateAcc()

document.addEventListener("DOMContentLoaded",(e)=>{
//DOMContentLoaded block start

document.querySelector('#logout').onclick = (e) =>{
    localStorage.clear();
    location.replace('login.html');
}

liveChart = new CanvasJS.Chart('liveChartContainer',{
    zoomEnabled:true,
    margin:10,
    title:{
        text:'Live Natural Gas Price'
    },
    axisX:{
        gridThickness:0.3,
        gridDashType:'dash',
        valueFormatString:'###s',

        crosshair:{
            enabled:true,
            thickness:0.5,
        }
    },
    axisY:{
        gridThickness:0,
        interlacedColor: "#F0F8FF",
        crosshair:{
            enabled:true,
            thickness:0.5
        }
    },
    data:[
        {
            toolTipContent:'{x}s from epoch, price:{y}',     
            type: 'line',
            name: 'mid price',
            showInLegend:true,
            markerType:'circle',
            markerColor:'orange',
            markerSize:1,
            color:'orange',
            dataPoints:priceData
        },
        shapes[0],
        shapes[1],
        shapes[2],
        shapes[3],
        shapes[4],
        shapes[5]

        
    ]
});
document.querySelector('#accounts').onclick = (e) =>{
    localStorage.removeItem('accNo');
    location.replace('accounts.html');
}
document.querySelector('#predict').onclick = ()=>{
    document.querySelector('#predict').innerHTML = "loading..."
    document.querySelector('#predict').disabled = true
    getAction().then(()=>{
        document.querySelector('#predict').innerHTML = "predict"
        document.querySelector('#predict').disabled = false
        let thisDate = new Date(modelEpoch*1000)
        document.querySelector('#modelEpoch').innerHTML = `Prediction is relative to data at ${thisDate.toLocaleString('en-GB')}`
        liveChart.render()
    })
}

document.querySelector("#predict").disabled = false;
let long = document.querySelector('#lToggle');
let short = document.querySelector('#sToggle');
short.onclick  = (e)=>{
    short.disabled = true;
    long.style['border-width'] = '1px';
    long.style['border-color'] = 'grey';
    long.style['font-weight'] = 'normal';
    short.style['border-color'] = 'orange';
    short.style['border-width'] = '3px';
    short.style['font-weight'] = 'bold';
    document.querySelector('#long').hidden = true;
    document.querySelector('#short').hidden = false;
    long.disabled = false;

}
long.onclick  = (e)=>{
    long.disabled = true;
    short.style['border-width'] = '1px';
    short.style['border-color'] = 'grey';
    short.style['font-weight'] = 'normal';
    long.style['border-color'] = 'orange';
    long.style['border-width'] = '3px';
    long.style['font-weight'] = 'bold'
    document.querySelector('#short').hidden = true;
    document.querySelector('#long').hidden = false;
    short.disabled = false;

}
document.querySelector('#sClose').onclick = (e)=>{
    let units = Number(document.querySelector('#sUnits').innerHTML)
    if(units <=0){
        alert('no short position to close')
        return
    }
    if(confirm(`Click 'OK' to close NATGAS short position of ${units} units with a market order`)){
        fetch(`https://api-fxtrade.oanda.com/v3/accounts/${accNo}/orders`,{method:'POST',headers : {'Authorization':`Bearer ${apiKey}`,'Accept-Datetime-Format':"UNIX",'Content-Type': "application/json"},body:JSON.stringify({
            order:{
                type:'MARKET',
                instrument:'NATGAS_USD',
                units:`${units}`,
                timeInForce:'FOK',
                positionFill:'REDUCE_ONLY'
            }
        })})
        .then((response)=>{
            if (response.status === 201){
                return response.json()
            }else{
                alert('failed to close short position')
            }
        })
        .then((jsonObj)=>{
            updateAcc()
            if(jsonObj.orderFillTransaction){
                alert('short position closed successfully')
            }
        })
    }
}
document.querySelector('#lClose').onclick = (e)=>{
    let units = Number(document.querySelector('#lUnits').innerHTML)
    if(units <=0){
        alert('no short position to close')
        return
    }
    if(confirm(`Click 'OK' to close NATGAS short position of ${units} units with a market order`)){
        fetch(`https://api-fxtrade.oanda.com/v3/accounts/${accNo}/orders`,{method:'POST',headers : {'Authorization':`Bearer ${apiKey}`,'Accept-Datetime-Format':"UNIX",'Content-Type': "application/json"},body:JSON.stringify({
            order:{
                type:'MARKET',
                instrument:'NATGAS_USD',
                units:`-${units}`,
                timeInForce:'FOK',
                positionFill:'REDUCE_ONLY'
            }
        })})
        .then((response)=>{
            if (response.status === 201){
                return response.json()
            }else{
                alert('failed to close long position')
            }
        })
        .then((jsonObj)=>{
            updateAcc()
            if(jsonObj.orderFillTransaction){
                alert('long position closed successfully')
            }
        })
    }
}
document.querySelector('#sAdd').onclick = (e)=>{
    let units = document.querySelector('#sAddU').value
    if (!units){
        units = document.querySelector('#sAddU').placeholder
    }
    if(confirm(`Click 'OK' to add ${units} units to NATGAS short position with a market order`)){
        fetch(`https://api-fxtrade.oanda.com/v3/accounts/${accNo}/orders`,{method:'POST',headers : {'Authorization':`Bearer ${apiKey}`,'Accept-Datetime-Format':"UNIX",'Content-Type': "application/json"},body:JSON.stringify({
            order:{
                type:'MARKET',
                instrument:'NATGAS_USD',
                units:`-${units}`,
                timeInForce:'FOK',
                positionFill:'DEFAULT'
            }
        })})
        .then((response)=>{
            if (response.status === 201){
                return response.json()
            }else{
                alert('failed to place order')
            }
        })
        .then((jsonObj)=>{
            updateAcc()
            if(jsonObj.orderFillTransaction){
                alert('order success')
            }
        })
    }
}
document.querySelector('#lAdd').onclick = (e)=>{
    let units = document.querySelector('#lAddU').value
    if (!units){
        units = document.querySelector('#lAddU').placeholder
    }
    if(confirm(`Click 'OK' to add ${units} units to NATGAS long position with a market order`)){
        fetch(`https://api-fxtrade.oanda.com/v3/accounts/${accNo}/orders`,{method:'POST',headers : {'Authorization':`Bearer ${apiKey}`,'Accept-Datetime-Format':"UNIX",'Content-Type': "application/json"},body:JSON.stringify({
            order:{
                type:'MARKET',
                instrument:'NATGAS_USD',
                units:units,
                timeInForce:'FOK',
                positionFill:'DEFAULT'
            }
        })})
        .then((response)=>{
            if (response.status === 201){
                return response.json()
            }else{
                alert('failed to place order')
            }
        })
        .then((jsonObj)=>{
            updateAcc()
            if(jsonObj.orderFillTransaction){
                alert('order success')
            }
        })
        
    }
}
//DOMContentLoaded block end
})