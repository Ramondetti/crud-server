"use strict"

// inizializzazione puntatori
const divIntestazione = document.getElementById("divIntestazione")
const divFilters = document.querySelector(".card")
const lstHair = document.getElementById("lstHair")
const divCollections =  document.getElementById("divCollections")
const table = document.getElementById("mainTable")
const thead = table.querySelector("thead")
const tbody = table.querySelector("tbody")
const divDettagli = document.getElementById("divDettagli")
const chkGender = divFilters.querySelectorAll("input[type=checkbox]")

// avvio
let currentCollection = "";
divFilters.style.display="none"
btnAdd.disabled = true
btnUpdate.disabled = true

getColletions()

chkGender[0].addEventListener("change",function(){
    chkGender[1].checked = false
})

chkGender[1].addEventListener("change",function(){
    chkGender[0].checked = false
})

async function getColletions(){
    const httResponse = await inviaRichiesta("GET","/getCollections")
    if(httResponse.status == 200){
        console.log(httResponse.data)
        const collections = httResponse.data
        const label = divCollections.querySelector("label")
        for (const collection of collections) {
            //clona la label, con true clona anche i discendenti della label
            const clonedLabel = label.cloneNode(true)
            clonedLabel.querySelector("span").textContent = collection.name
            clonedLabel.querySelector("input[type=radio]").addEventListener("click",function(){
                currentCollection = collection.name
                btnAdd.disabled = false
                btnUpdate.disabled = false
                getData()
            })
           divCollections.appendChild(clonedLabel)
        }
        //rimuove la label dal dom
        label.remove()
    }
    else
        alert(httResponse.status + " : " + httResponse.err)
}

async function getData(filter={}){
    const httResponse = await inviaRichiesta("GET",`/${currentCollection}`, filter)
    if(httResponse.status == 200){
        console.log(httResponse.data)
        const strongs = divIntestazione.querySelectorAll("strong")
        strongs[0].textContent = currentCollection
        strongs[1].textContent = httResponse.data.length

        tbody.innerHTML = ""

        for (const item of httResponse.data) {
            const tr = document.createElement("tr")

            let td = document.createElement("td")
                td.addEventListener("click",function(){
                getCurrentItem(item._id)
            })
            td.textContent = item._id
            tr.append(td)

            td = document.createElement("td")
            td.addEventListener("click",function(){
                getCurrentItem(item._id)
            })
            const secondKey = Object.keys(item)[1]
            td.textContent = item[secondKey]
            tr.append(td)
            thead.querySelectorAll("th")[1].textContent = secondKey

            //patch
            td = document.createElement("td")
            let div = document.createElement("div")
            div.addEventListener("click",function(){
                patchCurrent(item._id)
            })
            div.title = "patch"
            td.appendChild(div)
            //put
            div = document.createElement("div")
            div.addEventListener("click",function(){
                putCurrent(item._id)
            })
            div.title = "put"
            td.appendChild(div)
            //delete
            div = document.createElement("div")
            div.addEventListener("click",function(){
                deleteCurrent(item._id)
            })
            div.title = "delete"
            td.appendChild(div)
            tr.appendChild(td)

            tbody.append(tr)
        }
        if(currentCollection == "unicorns")
            divFilters.style.display = ""
        else
            divFilters.style.display = "none"

        divDettagli.innerHTML = ""
    }
    else
        alert(httResponse.status + " : " + httResponse.err)
}

async function getCurrentItem(_id){
    divDettagli.innerHTML = ""
    const httResponse = await inviaRichiesta("GET",`/${currentCollection}/${_id}`)
    if(httResponse.status == 200){
        console.log(httResponse.data)
        let currentItem = httResponse.data
        for (const key in currentItem) {
            const strong = document.createElement("strong")
            strong.textContent = key + " : "
            divDettagli.append(strong)

            const span = document.createElement("span")
            span.textContent = JSON.stringify(currentItem[key])
            divDettagli.append(span)
            divDettagli.append(document.createElement("br"))
        }
    }
    else
        alert(httResponse.status + " : " + httResponse.err)
}

btnFind.addEventListener("click",function(){
    getData(getFilters())
})

btnAdd.addEventListener("click",function(){
    divDettagli.innerHTML = ""
    const textarea = document.createElement("textarea")
    divDettagli.appendChild(textarea)
    textarea.style.height = "100px"
    textarea.value = '{\n "name": "pippo",\n "example":"modify this" \n}'
    addTextareaButton("POST")
})

function addTextareaButton(method, _id = ""){
    let button = document.createElement("button")
    divDettagli.appendChild(button)
    button.textContent = "Salva"
    button.classList.add("btn","btn-success","btn-sm")
    button.style.margin = "10px"

    button.addEventListener("click",async function(){
        let record = divDettagli.querySelector("textarea").value
        try {
            record = JSON.parse(record)
        } catch (error) {
            alert("JSON non valido\n"+error)
            return
        }

        let resource = "/" + currentCollection
        if(_id){
         resource += "/" + _id  
        }
        const httResponse = await inviaRichiesta(method, resource, record)
        if(httResponse.status == 200){
            console.log(httResponse.data)
            alert("Operazione eseguita con successo")
            getData()
        }
        else
            alert(httResponse.status + ":" + httResponse.err)
    })

    button = document.createElement("button")
    divDettagli.appendChild(button)

    button.textContent = "Annulla"
    button.classList.add("btn","btn-secondary","btn-sm")
    button.addEventListener("click",function(){
        divDettagli.innerHTML = ""
    })
}

async function deleteCurrent(_id){
    if(confirm("Vuoi veramente cancellare il record: " + _id + "?")){
        const resource = "/" + currentCollection + "/" + _id
        const httResponse = await inviaRichiesta("DELETE",resource)
        if(httResponse.status == 200){
            console.log(httResponse.data)
            alert("Elliminazione eseguita con successo")
            getData()
        }
        else
            alert(httResponse.status + " : " + httResponse.err)
    }
}

//delete with filters
btnDelete.addEventListener("click",async function(){
    let filters = getFilters()
    if(confirm("Vuoi veramente cancellare i record: " + JSON.stringify(filters) + "?")){
        const resource = "/" + currentCollection
        const httResponse = await inviaRichiesta("DELETE",resource,filters)
        if(httResponse.status == 200){
            console.log(httResponse.data)
            alert("Elliminazione eseguita con successo " + httResponse.data.deleteCount)
            getData()
        }
        else
            alert(httResponse.status + " : " + httResponse.err)
    }
})

btnUpdate.addEventListener("click",function(){
    divDettagli.innerHTML = ""
    const textarea = document.createElement("textarea")
    divDettagli.appendChild(textarea)
    textarea.style.height = 100 + "px"
    //esempio istruzione mongo
    textarea.value = `{"filter": {"gender": "m"},\n"action": {"$inc": { "vampires": 2}}}`
    addTextareaButton("PUT")
})

function getFilters(){
    const hair = lstHair.value
    let gender = ""
    const genderChecked = divFilters.querySelector("input[type=checkbox]:checked")
    if(genderChecked)
        gender = genderChecked.value

    let filters = {}
    if(hair != "All")
        filters.hair = hair.toLowerCase()
    if(gender)
        filters.gender = gender.toLowerCase()
    return filters
}

async function patchCurrent(_id){
    const resource = "/" + currentCollection + "/" + _id
    const httResponse = await inviaRichiesta("GET",resource)
    if(httResponse.status == 200){
        console.log(httResponse.data)
        divDettagli.innerHTML = ""
        const current = httResponse.data
        //rimuoviamo la chiave _id dal JSO
        delete(current._id)
        const textarea = document.createElement("textarea")
        divDettagli.appendChild(textarea)
        textarea.value = JSON.stringify(current,null,2)
        textarea.style.height = textarea.scrollHeight + "px"
        addTextareaButton("PATCH",_id)
    }
    else
        alert(httResponse.status + " : " + httResponse.err)
}

function putCurrent(_id){
    divDettagli.innerHTML = ""
    const textarea = document.createElement("textarea")
    divDettagli.appendChild(textarea)
    textarea.style.height = 100 + "px"
    //esempio istruzione mongo
    textarea.value = `{\n "$inc":{"vampires":2}\n}`
    addTextareaButton("PUT",_id)
}