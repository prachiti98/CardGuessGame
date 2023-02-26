
const cardObjectDefinitions = [
    {id:1, imagePath:'images/KH.svg'},
    {id:2, imagePath:'images/JC.svg'},
    {id:3, imagePath:'images/QD.svg'},
    {id:4, imagePath:'images/AS.svg'},
    {id:5, imagePath:'images/QC.svg'},
    {id:6, imagePath:'images/KS.svg'}
]
const aceId = 4

const cardBackImgPath = 'images/card-back-blue.png'

let cards = []

const playGameButtonElem = document.getElementById('playGame')
const hideButtonElem = document.getElementById('hideCardsDiv')
const betTextElem = document.getElementById('betText')
const wagerDivElem = document.getElementById('wagerDiv')

const cardContainerElem = document.querySelector('.card-container')

const collapsedGridAreaTemplate = '"a a a" "a a a"'
const cardCollectionCellClass = ".card-pos-a"

const numCards = cardObjectDefinitions.length

let cardPositions = []


let gameInProgress = false 
let shufflingInProgress = false 
let cardsRevealed = false


const currentGameStatusElem = document.querySelector('.current-status')
const scoreContainerElem = document.querySelector('.header-score-container')
const scoreElem = document.querySelector('.score')
const roundContainerElem = document.querySelector('.header-round-container')
const roundElem = document.querySelector('.round')

const winColor = "green"
const loseColor = "red"
const tryColor = "orange"
const primaryColor = "black"

let roundNum = 0
let maxRounds = 5
let tryNum = 0
let maxtry =  1

let gameObj = {}
let placeholders = 6
let hint_used = 0
let wager = 0
let earnings = 0
const localStorageGameKey = "HTA"

const shuffleSound = document.getElementById('shuffle-sound');

const incorrectSound = document.getElementById('incorrect-sound');
incorrectSound.load();

const correctSound = document.getElementById('correct-sound');
correctSound.load();

const victorySound = document.getElementById('victory');
victorySound.load();

/* <div class="card">
<div class="card-inner">
    <div class="card-front">
        <img src="images/card-JackClubs.png" alt="" class="card-img">
    </div>
    <div class="card-back">
        <img src="images/card-back-Blue.png" alt="" class="card-img">
    </div>
</div>
</div> */


loadGame()

function hideCards()
{
    hint_used = 1
    for (let i = 0; i < Math.floor(placeholders/2); i++) {
        rand = Math.floor(Math.random() * (placeholders - 1)) + 1
        while (rand == aceId)
        {
            rand = Math.floor(Math.random() * (placeholders - 1)) + 1
        }
        cardclass = document.getElementById(rand)
        if (cardclass.style.visibility == 'hidden')
        {
            i = i - 1
        }
        else
        {
            cardclass.style.visibility = 'hidden'
        }
    }
}

function removeHideCards()
{
    for (let i = 0; i < placeholders; i++)
    {
        cardclass = document.getElementById(i)
        cardclass.style.removeProperty('visibility')
    }
}

function gameOver()
{
    updateStatusElement(scoreContainerElem,"none")
    updateStatusElement(roundContainerElem,"none")

    if(earnings > 400){
        victorySound.play();
        const gameOverMessage = `CONGRATS! You won - <span class = 'badge'>$${earnings}</span> <div>Click 'Play Game' button to play again</div>`
        updateStatusElement(currentGameStatusElem,"block",primaryColor,gameOverMessage)
    }
    else{
        const gameOverMessage = `Sorry, you lost! Better luck next time. Click 'Play Game' button to try again`
        
        updateStatusElement(currentGameStatusElem,"block",primaryColor,gameOverMessage)

    }

    gameInProgress = false
    playGameButtonElem.disabled = false
}

function endRound()
{
    setTimeout(()=>{
        if(roundNum == maxRounds)
        {
            gameOver()
            return
        }
        else
        {
            startRound()
        }
    },3000)
}

function chooseCard(card)
{
    if(canChooseCard())
    {
        evaluateCardChoice(card)
        saveGameObjectToLocalStorage(earnings, roundNum)
        flipCard(card,false)

        setTimeout(() => {
            flipCards(false)
            updateStatusElement(currentGameStatusElem,"block", primaryColor,"Card positions revealed")

            endRound()

        },3000)
        cardsRevealed = true
    }

}

function calculateMultiplier(roundNum)
{
    if (hint_used) 
    {
        return 1.5
    }
    return 2
}

function calculateScore()
{
    multiplier = calculateMultiplier(roundNum)
    earnings += wager * multiplier
}

function updateScore()
{
    calculateScore()
    updateStatusElement(scoreElem, "block", primaryColor, `Earnings <span class='badge'>$${earnings}</span>`)
}

function updateStatusElement(elem, display, color, innerHTML)
{
    elem.style.display = display

    if(arguments.length > 2)
    {
        elem.style.color = color
        elem.innerHTML = innerHTML
    }

}

function outputChoiceFeedBack(hit)
{
    if(hit)
    {
        correctSound.play();
        updateStatusElement(currentGameStatusElem, "block", winColor, "Hit!! - Well Done!! :)")
        tryNum = 0;
    }
    else if(hit == false && tryNum < maxtry)
    {
        incorrectSound.play();
        console.log(tryNum)
        tryNum = tryNum + 1;
        console.log(tryNum)
        updateStatusElement(currentGameStatusElem, "block", tryColor, "Oops, Don't worry! You can try again!!")
        chooseCard()
    }
    else
    {
        incorrectSound.play();
        updateStatusElement(currentGameStatusElem, "block", loseColor, "Missed!! :(")
        tryNum = 0;
    }
}

function evaluateCardChoice(card)
{
    if(card.id == aceId)
    {
        updateScore()
        outputChoiceFeedBack(true)
    }
    else
    {
        outputChoiceFeedBack(false)
    }
}

function canChooseCard()
{
    return gameInProgress == true && !shufflingInProgress && !cardsRevealed
}



function loadGame(){
    createCards()

    cards = document.querySelectorAll('.card')

    cardFlyInEffect()

    playGameButtonElem.addEventListener('click', ()=>startGame())
    hideButtonElem.style.display = "none"
    betTextElem.style.display = "none"
    wagerDivElem.style.display = "none"
    document.getElementById('hideCards').addEventListener('click', ()=>hideCards())

    updateStatusElement(scoreContainerElem,"none")
    updateStatusElement(roundContainerElem,"none")

}

function checkForIncompleteGame()
{
    const serializedGameObj = getLocalStorageItemValue(localStorageGameKey)
    if(serializedGameObj)
    {
        gameObj = getObjectFromJSON(serializedGameObj)

        if(gameObj.round >= maxRounds)
        {
            removeLocalStorageItem(localStorageGameKey)
        }
        else
        {
            if(confirm('Would you like to continue with your last game?'))
            {
                earnings = gameObj.earnings
                roundNum = gameObj.round
            }
        }

    }

}

function startGame(){
    initializeNewGame()
    startRound()
}
function initializeNewGame(){
    earnings = 0
    roundNum = 0

    checkForIncompleteGame()

    shufflingInProgress = false

    updateStatusElement(scoreContainerElem,"flex")
    updateStatusElement(roundContainerElem,"flex")

    updateStatusElement(scoreElem,"block",primaryColor,`Earnings <span class='badge'>$${earnings}</span>`)
    updateStatusElement(roundElem,"block",primaryColor,`Round <span class='badge'>${roundNum}</span>`)

}

function accept_wager()
{
    wager = document.getElementById('wager').value
    console.log('wager'+wager)
}

function startRound()
{
    initializeNewRound()
    collectCards()
    flipCards(true)
    shuffleCards()
    accept_wager()
}
function initializeNewRound()
{
    roundNum++
    playGameButtonElem.disabled = true

    gameInProgress = true
    shufflingInProgress = true
    cardsRevealed = false

    updateStatusElement(currentGameStatusElem, "block", primaryColor, "Shuffling...")
    
    updateStatusElement(roundElem, "block", primaryColor, `Round <span class='badge'>${roundNum}</span>`)

}

function collectCards(){
    transformGridArea(collapsedGridAreaTemplate)
    addCardsToGridAreaCell(cardCollectionCellClass)

}

function transformGridArea(areas)
{
    cardContainerElem.style.gridTemplateAreas = areas

}
function addCardsToGridAreaCell(cellPositionClassName)
{
    const cellPositionElem = document.querySelector(cellPositionClassName)

    cards.forEach((card, index) =>{
        card.style.removeProperty('visibility')
        addChildElement(cellPositionElem, card)
    })
}

function flipCard(card, flipToBack)
{
    const innerCardElem = card.firstChild

    if(flipToBack && !innerCardElem.classList.contains('flip-it'))
    {
        innerCardElem.classList.add('flip-it')
    }
    else if(innerCardElem.classList.contains('flip-it'))
    {
        innerCardElem.classList.remove('flip-it')
    }

}

function flipCards(flipToBack){
    cards.forEach((card,index)=>{
        setTimeout(() => {
            flipCard(card,flipToBack)
        },index * 100)
    })
}

function cardFlyInEffect()
{
    const id = setInterval(flyIn, 0.5)
    let cardCount = 0

    let count = 0

    function flyIn()
    {
        count++
        if(cardCount == numCards)
        {
            clearInterval(id)
            playGameButtonElem.style.display = "inline-block" 
            hideButtonElem.style.display = "flex"
            betTextElem.style.display = "flex"
            wagerDivElem.style.display = "flex"
        }
        if(count == 1 || count == 250 || count == 500 || count == 750 || count == 1000 || count == 1250)
        {
            cardCount++
            let card = document.getElementById(cardCount)
            card.classList.remove("fly-in")
        }
    }



}

function removeShuffleClasses()
{
    cards.forEach((card) =>{
        card.classList.remove("shuffle-left")
        card.classList.remove("shuffle-right")
    })
}
function animateShuffle(shuffleCount)
{
    const random1 = Math.floor(Math.random() * numCards) + 1
    const random2 = Math.floor(Math.random() * numCards) + 1

    let card1 = document.getElementById(random1)
    let card2 = document.getElementById(random2)

    if (shuffleCount % 6 == 0)
    {
        card1.classList.toggle("shuffle-left")
        card1.style.zIndex = 100
    }
    if (shuffleCount % 10 == 0)
    {
        card2.classList.toggle("shuffle-right")
        card2.style.zIndex = 200
    }

}

function shuffleCards()
{
    let shuffleCount = 0
    const id = setInterval(shuffle, 12)


    shuffleSound.play();

    setTimeout(() => {
        shuffleSound.currentTime = 0;
        shuffleSound.pause();
      }, 1500);

    
    function shuffle()
    {
        randomizeCardPositions()
       
        animateShuffle(shuffleCount)
       
        if(shuffleCount == 100)
        {
            clearInterval(id)
            shufflingInProgress = false
            removeShuffleClasses()
            dealCards()
            updateStatusElement(currentGameStatusElem, "block", primaryColor, "Please click the card that you think is the Ace of Spades...")

        }
        else{
            shuffleCount++
        }

    }

}
function randomizeCardPositions()
{
    const random1 = Math.floor(Math.random() * numCards) + 1
    const random2 = Math.floor(Math.random() * numCards) + 1

    const temp = cardPositions[random1 - 1]

    cardPositions[random1 - 1] = cardPositions[random2 - 1]
    cardPositions[random2 - 1] = temp

}
function dealCards()
{
    addCardsToAppropriateCell()
    const areasTemplate = returnGridAreasMappedToCardPos()

    transformGridArea(areasTemplate)

}
function returnGridAreasMappedToCardPos()
{
    let firstPart = ""
    let secondPart = ""
    let areas = ""

    cards.forEach((card, index) => {
        if(cardPositions[index] == 1)
        {
            areas = areas + "a "
        }
        else if(cardPositions[index] == 2)
        {
            areas = areas + "b "
        }
        else if (cardPositions[index] == 3)
        {
            areas = areas + "c "
        }
        else if (cardPositions[index] == 4)
        {
            areas = areas + "d "
        }
        else if (cardPositions[index] == 5)
        {
            areas = areas + "e "
        }
        else if (cardPositions[index] == 6)
        {
            areas = areas + "f "
        }
        if (index == 2)
        {
            firstPart = areas.substring(0, areas.length - 1)
            
        }
        else if (index == 5)
        {
            secondPart = areas.substring(6, 12)
        }

    })

    return `"${firstPart}" "${secondPart}"`


}


function addCardsToAppropriateCell()
{
    cards.forEach((card)=>{
        addCardToGridCell(card)
    })
}



function createCards()
{
    cardObjectDefinitions.forEach((cardItem)=>{
        createCard(cardItem)
    })
}


function createCard(cardItem){

    //create div elements that make up a card
    const cardElem = createElement('div')
    const cardInnerElem = createElement('div')
    const cardFrontElem = createElement('div')
    const cardBackElem = createElement('div')

    //create front and back image elements for a card
    const cardFrontImg = createElement('img')
    const cardBackImg = createElement('img')

    //add class and id to card element
    addClassToElement(cardElem, 'card')
    addClassToElement(cardElem, 'fly-in')
    addIdToElement(cardElem, cardItem.id)

    //add class to inner card element
    addClassToElement(cardInnerElem, 'card-inner')
    
    //add class to front card element
    addClassToElement(cardFrontElem, 'card-front')

    //add class to back card element
    addClassToElement(cardBackElem, 'card-back')

    //add src attribute and appropriate value to img element - back of card
    addSrcToImageElem(cardBackImg, cardBackImgPath)

    //add src attribute and appropriate value to img element - front of card
    addSrcToImageElem(cardFrontImg, cardItem.imagePath)

    //assign class to back image element of back of card
    addClassToElement(cardBackImg, 'card-img')
   
    //assign class to front image element of front of card
    addClassToElement(cardFrontImg, 'card-img')

    //add front image element as child element to front card element
    addChildElement(cardFrontElem, cardFrontImg)

    //add back image element as child element to back card element
    addChildElement(cardBackElem, cardBackImg)

    //add front card element as child element to inner card element
    addChildElement(cardInnerElem, cardFrontElem)

    //add back card element as child element to inner card element
    addChildElement(cardInnerElem, cardBackElem)

    //add inner card element as child element to card element
    addChildElement(cardElem, cardInnerElem)

    //add card element as child element to appropriate grid cell
    addCardToGridCell(cardElem)

    initializeCardPositions(cardElem)

    attatchClickEventHandlerToCard(cardElem)
    
}
function attatchClickEventHandlerToCard(card){
    card.addEventListener('click', () => chooseCard(card))
}

function initializeCardPositions(card)
{
    cardPositions.push(card.id)
}

function createElement(elemType){
    return document.createElement(elemType)

}
function addClassToElement(elem, className){
    elem.classList.add(className)
}
function addIdToElement(elem, id){
    elem.id = id
}
function addSrcToImageElem(imgElem, src){
    imgElem.src = src
}
function addChildElement(parentElem, childElem){
    parentElem.appendChild(childElem)
}

function addCardToGridCell(card)
{
    const cardPositionClassName = mapCardIdToGridCell(card)

    const cardPosElem = document.querySelector(cardPositionClassName)

    addChildElement(cardPosElem, card)

}
function mapCardIdToGridCell(card){
   
    if(card.id == 1)
    {
        return '.card-pos-a'
    }
    else if(card.id == 2)
    {
        return '.card-pos-b'
    }
    else if(card.id == 3)
    {
        return '.card-pos-c'
    }
    else if(card.id == 4)
    {
        return '.card-pos-d'
    }
    else if(card.id == 5)
    {
        return '.card-pos-e'
    }
    else if(card.id == 6)
    {
        return '.card-pos-f'
    }
}

//local storage functions
function getSerializedObjectAsJSON(obj)
{
    return JSON.stringify(obj)
}
function getObjectFromJSON(json)
{
    return JSON.parse(json)
}
function updateLocalStorageItem(key, value)
{
    localStorage.setItem(key, value)
}
function removeLocalStorageItem(key)
{
    localStorage.removeItem(key)
}
function getLocalStorageItemValue(key)
{
    return localStorage.getItem(key)
}

function updateGameObject(score,round)
{
    gameObj.score = score
    gameObj.round = round
}
function saveGameObjectToLocalStorage(score,round)
{
    updateGameObject(score, round)
    updateLocalStorageItem(localStorageGameKey, getSerializedObjectAsJSON(gameObj))
}

// Get the modal container and the button that opens it
const modal = document.getElementById('myModal');
const btn = document.getElementById('myBtn');
const closeBtn = document.getElementsByClassName('close')[0];

// Add an event listener to the button that opens the modal
btn.addEventListener('click', openModal);

// Add an event listener to the close button in the modal
closeBtn.addEventListener('click', closeModal);

// Function to open the modal
function openModal() {
  modal.style.display = 'block';
}

// Function to close the modal
function closeModal() {
  modal.style.display = 'none';
}

// create a new footer element
const footer = document.createElement("footer");

// add content to the footer element
footer.innerHTML = "Copyright © 2023 - Made with love at Hackher";

// append the footer element to the body of the webpage
document.body.appendChild(footer);