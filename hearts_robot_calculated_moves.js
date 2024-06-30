export class HeartsRobotCalculated {
    #model;
    #controller;
    #position;

    constructor(model, controller, position) {
        this.#model = model;
        this.#controller = controller;
        this.#position = position;

        this.#model.addEventListener('stateupdate', () => {
            let state = this.#model.getState();
            if ((state === 'passing') && (this.#model.getPassing() !== 'none')) {
                this.#passCards();
            }
        });

        this.#model.addEventListener('trickstart', () => this.#playCard());
        this.#model.addEventListener('trickplay', () => this.#playCard());
    }

    #playCard() {
        if (this.#model.getCurrentTrick().nextToPlay() === this.#position) {
            let playable_cards = this.#model.getHand(this.#position)
                .getCards()
                .filter(c => this.#controller.isPlayable(this.#position, c));
            if (playable_cards.length > 0) {
                let priority_cards = playable_cards.filter(c => c.getSuit() === 'clubs' || c.getSuit() === 'diamonds');
                if (priority_cards.length > 0) {
                    priority_cards.sort((a, b) => b.getRank() - a.getRank());
                    let card = priority_cards[0];
                    this.#controller.playCard(this.#position, card);
                } else {
                    playable_cards.sort((a, b) => b.getRank() - a.getRank());
                    let card = playable_cards[0];
                    this.#controller.playCard(this.#position, card);
                }
            } else {
                // This should never happen.
                console.log(`${this.#position} has no playable cards`);
            }
        }
    }

    #passCards() {
        let hand = this.#model.getHand(this.#position);
        let cardsToPass = [];

        hand.getCards().forEach(card => {
            if (card.getSuit() === 'spades' && (card.getRank() === 13 || card.getRank() === 12 || card.getRank() === 14)) {
                cardsToPass.push(card);
            } else if (card.getSuit() === 'clubs' && card.getRank() === 2) {
                cardsToPass.push(card);
            } else if (card.getSuit() === 'hearts' && card.getRank() > 9) {
                cardsToPass.push(card);
            } else if ((card.getSuit() === 'diamonds' || card.getSuit() === 'clubs') && card.getRank() > 10) {
                cardsToPass.push(card);
            }
        });

        if (cardsToPass.length > 3) {
            cardsToPass.sort((a, b) => {
                if (a.getSuit() === 'spades' && (a.getRank() === 13 || a.getRank() === 12 || a.getRank() === 14)) {
                    return -1;
                } else if (b.getSuit() === 'spades' && (b.getRank() === 13 || b.getRank() === 12 || b.getRank() === 14)) {
                    return 1;
                } else if (a.getSuit() === 'hearts' && a.getRank() > 9) {
                    return -1;
                } else if (b.getSuit() === 'hearts' && b.getRank() > 9) {
                    return 1;
                } else if ((a.getSuit() === 'diamonds' || a.getSuit() === 'clubs') && a.getRank() > 10) {
                    return -1;
                } else if ((b.getSuit() === 'diamonds' || b.getSuit() === 'clubs') && b.getRank() > 10) {
                    return 1;
                }
                return 0;
            });

            cardsToPass = cardsToPass.slice(0, 3);
        }

        if (cardsToPass.length < 3) {
            let tempHand = hand;
            tempHand.getCards().sort((a, b) => {
                return b.getRank() - a.getRank();
            });
            tempHand.getCards().forEach(card => {
                if (!cardsToPass.includes(card) && cardsToPass.length < 3) {
                    cardsToPass.push(card);
                }
            });
        }

        this.#controller.passCards(this.#position, cardsToPass);
    }
}