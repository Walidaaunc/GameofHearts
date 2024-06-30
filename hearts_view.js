import {HeartsRobotRandom} from "./hearts_robot_random_moves.js";
import {HU} from "./hearts_utils.js";
import {HeartsRobotCalculated} from "./hearts_robot_calculated_moves.js";
export class HeartsView {

    #model
    #controller
    nameOfUser

    passSound = new Audio('./PassingCardsSound.mp3');
    playSound = new Audio('./PlayingCardSound.mp3');
    cheeringSound = new Audio('./CheeringSound.mp3');
    suitSymbols = {
        hearts: 'hearts.png',
        spades: 'spades.png',
        clubs: 'clubs.png',
        diamonds: 'diamonds.png'
    };

    constructor(model, controller) {
        this.#model = model;
        this.#controller = controller;
    }

    render(render_div) {
        // Renders the UI.
        this.nameOfUser = '';
        this.start(render_div);
        this.#model.addEventListener('stateupdate', () => {
            if (this.#model.getState() === 'passing') {
                if (this.#model.getPassing() !== 'none') {
                    this.renderPassingInterface(render_div);
                }
            } else if (this.#model.getState() === 'complete') {
                let winner = null;
                let winning_score = Number.MAX_VALUE;
                HU.positions.forEach(p => {
                    if (this.#model.getScore(p) < winning_score) {
                        winning_score = this.#model.getScore(p);
                        winner = p;
                    }
                });
                this.cheeringSound.play();
                render_div.innerHTML = `<div class="winningMessage">Match Over, ${this.#model.getPlayerName(winner)} Wins!</div>`;
            }
        });

        this.#model.addEventListener('trickstart', () => {
            let currentTrickRound = 14 - this.#model.getTricksLeft();
            let currentRoundNum = this.#model.getScoreLog().length + 1;
            render_div.innerHTML = `<h3 id="trickStartedMessage">Trick ${currentTrickRound} of Round ${currentRoundNum}!</h3>
            <h3 id="trickCollection">Collection of the Current Trick:<br></h3>
            <div id="playHere"></div>
            <h3 id="scoreboard">Scoreboard:</h3>`;
            this.scoreUpdate(document.getElementById('scoreboard'));
            if (this.#model.getCurrentTrick().getLead() === 'south' &&
                this.#model.getCurrentTrick().nextToPlay() === 'south') {
                let playHere = document.getElementById('playHere');
                let tempElement = document.createElement('div');
                playHere.innerText = '';
                playHere.appendChild(tempElement);
                this.renderPlayingInterface(tempElement);
            }
        });

        this.#model.addEventListener('trickplay', (e) => {
            let trickCollection = document.getElementById('trickCollection');
            let position = e.detail.position;
            let card = e.detail.card;

            let container = document.createElement('div');
            container.classList.add('trickPlay');

            let playerNameSpan = document.createElement('span');
            playerNameSpan.classList.add('playerName');
            playerNameSpan.innerText = this.#model.getPlayerName(position);

            let cardElement = document.createElement('div');
            cardElement.classList.add('card');

            let suitImage = document.createElement('img');
            suitImage.src = this.suitSymbols[card.getSuit()];
            suitImage.classList.add('suitImage');
            cardElement.appendChild(suitImage);

            let rankElement = document.createElement('span');
            rankElement.classList.add('rank');
            let rankSymbol;
            switch (card.getRank()) {
                case 11:
                    rankSymbol = 'J';
                    break;
                case 12:
                    rankSymbol = 'Q';
                    break;
                case 13:
                    rankSymbol = 'K';
                    break;
                case 14:
                    rankSymbol = 'A';
                    break;
                default:
                    rankSymbol = card.getRank().toString();
            }
            rankElement.innerText = rankSymbol;
            cardElement.appendChild(rankElement);

            container.appendChild(cardElement);
            container.appendChild(playerNameSpan);

            trickCollection.appendChild(container);

            if (this.#model.getCurrentTrick().nextToPlay() === 'south') {
                let playHere = document.getElementById('playHere');
                let tempElement = document.createElement('div');
                playHere.innerText = '';
                playHere.appendChild(tempElement);
                this.renderPlayingInterface(tempElement);
            }
        });
    }

    start(render_div) {
        let startDiv = document.createElement('div');
        startDiv.innerHTML = `<h3>Hello! Please Enter Your Player's Name!</h3>
                                  <input type="text" id="usernameInput" />
                                  <button id="startGameButton">Start Game</button>`;
        startDiv.setAttribute("id", "startDiv");
        render_div.appendChild(startDiv);

        let startGameButton = document.getElementById('startGameButton');
        startGameButton.addEventListener('click', () => {
            let userName = document.getElementById('usernameInput').value.toLowerCase();
            userName = userName.charAt(0).toUpperCase() + userName.slice(1);
            if (userName !== '') {
                let west_robot = new HeartsRobotRandom(this.#model, this.#controller, 'west');
                let north_robot = new HeartsRobotRandom(this.#model, this.#controller, 'north');
                let east_robot = new HeartsRobotRandom(this.#model, this.#controller, 'east');
                this.nameOfUser = userName;
                this.#controller.startGame('North', 'East', userName, 'West');
            }
        });
    }

    renderPassingInterface(render_div) {
        render_div.innerHTML = '';
        let passInterfaceDiv = document.createElement('div');
        let passingDirection = this.#model.getPassing();
        passingDirection = passingDirection.charAt(0).toUpperCase() + passingDirection.slice(1);
        if (this.#model.getPassing() !== 'across') {
            passingDirection = `to the ${passingDirection}`;
        }
        passInterfaceDiv.innerHTML = `
            <h3 id="selectMessage">Select 3 Cards to Pass ${passingDirection}!</h3>
            <div id="userHand"></div>
            <button id="passCardsButton">Pass Cards</button>`;
        render_div.appendChild(passInterfaceDiv);

        let scoreboard = document.createElement('h3');
        scoreboard.innerText = 'Scoreboard:';
        scoreboard.id = 'scoreboard';
        render_div.appendChild(scoreboard);
        this.scoreUpdate(document.getElementById('scoreboard'));

        let passArr = [];
        this.renderUserHand(document.getElementById('userHand'), passArr);

        let passCardsButton = document.getElementById('passCardsButton');
        passCardsButton.addEventListener('click', () => {
            if (passArr.length === 3) {
                this.passSound.play();
                this.#controller.passCards('south', passArr);
            }
        });
    }

    renderPlayingInterface(render_div) {
        render_div.innerHTML = '';
        let playInterfaceDiv = document.createElement('div');
        playInterfaceDiv.innerHTML = `
            <div id="userHand"></div>
            <button id="playCardsButton">Play Card</button>`;
        render_div.appendChild(playInterfaceDiv);

        let playArr = [];
        this.renderUserHand(document.getElementById('userHand'), playArr);

        let playCardsButton = document.getElementById('playCardsButton');
        playCardsButton.addEventListener('click', () => {
            if (playArr.length === 1 && this.#controller.isPlayable('south', playArr[0])) {
                this.playSound.play();
                this.#controller.playCard('south', playArr[0]);
            }
        });
    }

    renderUserHand(handDiv, arr) {
        let textElement = document.createElement('h3');
        textElement.innerText = `${this.nameOfUser}\'s Cards`;
        textElement.setAttribute('id', "nameOfUserCards");
        handDiv.appendChild(textElement);
        let userHand = this.#model.getHand('south').getCards();
        userHand.forEach(card => {
            let cardElementDiv = document.createElement('div');
            cardElementDiv.classList.add('card');
            cardElementDiv.dataset.selected = 'false'; // Initializes selected attribute

            cardElementDiv.addEventListener("click", (e) => {
                let isSelected = cardElementDiv.dataset.selected === 'true';
                if (!isSelected) {
                    cardElementDiv.classList.add('selected');
                    cardElementDiv.dataset.selected = 'true';
                    arr.push(card);
                } else {
                    cardElementDiv.classList.remove('selected');
                    cardElementDiv.dataset.selected = 'false';
                    arr.splice(arr.indexOf(card), 1);
                }
            });

            let suitImage = document.createElement('img');
            suitImage.src = this.suitSymbols[card.getSuit()];
            suitImage.classList.add('suitImage');
            cardElementDiv.appendChild(suitImage);

            let rankSymbol;
            switch (card.getRank()) {
                case 11:
                    rankSymbol = 'J';
                    break;
                case 12:
                    rankSymbol = 'Q';
                    break;
                case 13:
                    rankSymbol = 'K';
                    break;
                case 14:
                    rankSymbol = 'A';
                    break;
                default:
                    rankSymbol = card.getRank().toString();
            }

            let rankElement = document.createElement('span');
            rankElement.classList.add('rank');
            rankElement.innerText = rankSymbol;
            cardElementDiv.appendChild(rankElement);

            handDiv.appendChild(cardElementDiv);
        });
    }

    scoreUpdate(currentScoreElement) {
        let scoreLog = this.#model.getScoreLog();

        let table = document.createElement('table');
        table.classList.add('scoreTable');

        let headerRow = table.insertRow();
        headerRow.classList.add('scoreHeader');
        let headerNames = ['Round', this.#model.getPlayerName('north'), this.#model.getPlayerName('east'),
            this.#model.getPlayerName('south'), this.#model.getPlayerName('west')];
        headerNames.forEach(name => {
            let cell = document.createElement('th');
            cell.textContent = name;
            headerRow.appendChild(cell);
        });

        scoreLog.forEach((entry, index) => {
            let row = table.insertRow();
            let cells = [index + 1, entry.north, entry.east, entry.south, entry.west];
            cells.forEach(cellData => {
                let cell = row.insertCell();
                cell.textContent = cellData;
            });
        });

        let totalRow = table.insertRow();
        let totalCell = totalRow.insertCell();
        totalCell.textContent = 'Current Totals:';

        let totalScores = [this.#model.getScore('north'), this.#model.getScore('east'),
            this.#model.getScore('south'), this.#model.getScore('west')];
        totalScores.forEach(score => {
            let cell = totalRow.insertCell();
            cell.textContent = score;
        });

        currentScoreElement.appendChild(table);
    }
}