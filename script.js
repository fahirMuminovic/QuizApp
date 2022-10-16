//game setup assetsionNumber
const startGameButton = document.getElementById('start');
const gameConfigurationScreen = document.getElementById('game-setup');
const choosenNumberOfQuestions = document.getElementById('number-of-questions');
const choosenNumberOfQuestionsSliderValue = document.getElementById('range-slider-value');
//game assets
const questionElement = document.getElementById('question');
const answersTextElement = document.querySelectorAll('p.answerText');
const answerContainers = document.querySelectorAll('.answer-wrapper');
const currentQuestionNum = document.getElementById('questionNumber');
const questionAnswerPopupMsg = document.getElementById('modal');
const endGameModal = document.getElementById('game-end-modal');
const quitButton = document.getElementById('quit-button');

let quizData = [];
let correctAnswers = [];
let incorrectAnswers = [];

let correctlyAnswered = [];
let incorrectlyAnswered = [];

//Event Listeners//
startGameButton.addEventListener('click', (e) => {
	e.preventDefault();
	startGame();
});

choosenNumberOfQuestions.addEventListener('input', () => {
	//update the display of chosen questions that is positioned below the slider
	choosenNumberOfQuestionsSliderValue.innerText = choosenNumberOfQuestions.value;
});

window.onload = () => {
	//set the default value for number of questions to 10
	choosenNumberOfQuestions.value = 10;
	choosenNumberOfQuestionsSliderValue.innerText = choosenNumberOfQuestions.value;
};

answerContainers.forEach((answerContainer) => {
	//check answer
	answerContainer.addEventListener('click', (event) => {
		checkUsersAnswer(event);
	});
});

quitButton.addEventListener('click', endGame);

//Functions//

//fetches data from https://the-trivia-api.com
async function fetchQuestions() {
	const gameConfig = await configureGame();
	const categories = gameConfig.categories;
	const limit = Number(gameConfig.limit);
	const difficulty = gameConfig.difficulty;

	const url = `https://the-trivia-api.com/api/questions?categories=${categories}&limit=${limit}&difficulty=${difficulty}`;
	const response = await fetch(url);
	const data = await response.json();

	data.forEach((el) => {
		const fetchedData = {
			questionText: `${el.question}`,
			correctAnswerText: `${el.correctAnswer.trim()}`,
			incorrectAnswersText: [...el.incorrectAnswers],
		};
		//add this element to global arrays
		addData(quizData, fetchedData);
		addData(correctAnswers, el.correctAnswer);
		addData(incorrectAnswers, el.incorrectAnswers);
	});
	return quizData;
}

async function configureGame() {
	const allCategories = [
		'arts_and_literature',
		'film_and_tv',
		'food_and_drink',
		'general_knowledge',
		'geography',
		'history',
		'music',
		'science',
		'society_and_culture',
		'sports_and_leisure',
	];
	const categories = document.querySelectorAll('#checkBoxes input:checked');
	const gameDifficulty = document.querySelectorAll('#game-difficulty option:checked');

	//get the user configurations for the game and format them
	let choosenCategories = [...categories].map((option) => option.value).join(',');
	let choosenQuestionNumber = choosenNumberOfQuestions.value;
	let choosengameDifficulty = [...gameDifficulty].map((option) => option.value).join();

	choosenCategories = choosenCategories === '' ? allCategories.join(',') : choosenCategories;

	return {
		categories: choosenCategories,
		limit: choosenQuestionNumber,
		difficulty: choosengameDifficulty,
	};
}

async function startGame() {
	//make sure that the UI is populated
	await populateUI();
	//removes the used for game configuration on page load
	gameConfigurationScreen.classList.add('done');
}
//pupulates the UI with the question and answers on initial page load
async function populateUI() {
	let providedData = await fetchQuestions();
	let firstQuestion = providedData[0];

	//display the first question that is fetched on the web page
	questionElement.textContent = firstQuestion.questionText;
	//display the possible answers
	displayPossibleAnswers(firstQuestion);

	//update the ProgressBar
	updateProgressBar();
}

function displayPossibleAnswers(question) {
	let counter = 0;
	let randomizedCorrectAnswerPosition = randomizeCorrectAnswer();

	//loop through the answer containers on the web page
	answersTextElement.forEach((answerText, index) => {
		if (index === randomizedCorrectAnswerPosition) {
			//set the correct answer at this index/position
			answerText.textContent = question.correctAnswerText;
		} else {
			//set the incorrect answer at this index/position
			answerText.textContent = question.incorrectAnswersText[counter];
			counter++;
		}
	});
}

function nextQuestion(questions = quizData) {
	//get the index of next question
	const questionNum = currentQuestionNum.value;

	if (questionNum === quizData.length) {
		showEndGameScreen();
	}

	//increment the dom element in progress bar
	currentQuestionNum.value += 1;

	questions.forEach((question, elIndex) => {
		if (elIndex === questionNum) {
			//display the question on the page
			questionElement.textContent = question.questionText;
			//display the possible answers
			displayPossibleAnswers(question);
		}
	});
	updateProgressBar();
}

function checkUsersAnswer(event) {
	let answerContainer = event.target;
	let selectedAnswerText = '';
	let container = undefined;

	//depending on which part of the answer container is clicked get the clicked answer text
	if (answerContainer.classList.contains('answerText')) {
		container = answerContainer.parentElement;
		selectedAnswerText = answerContainer.innerText.trim();
	} else if (answerContainer.classList.contains('answer-letter')) {
		container = answerContainer.parentElement;
		selectedAnswerText = container.lastElementChild.innerText.trim();
	} else if (answerContainer.classList.contains('answer-wrapper')) {
		container = answerContainer;
		selectedAnswerText = answerContainer.lastElementChild.textContent.trim();
	}

	//check if selected answer is correct
	if (correctAnswers.includes(selectedAnswerText)) {
		//add this answer to correctlyAnswered
		addData(correctlyAnswered, selectedAnswerText);
		//display that the choosen answer is correct
		container.classList.toggle('correct');

		//show popup
		questionAnswerPopupMsg.classList.toggle('show');
		questionAnswerPopupMsg.firstElementChild.textContent = `🎉 Congratulations that is correct 🎉`;

		//wait for 3 seconds and move to next question, remove toggled classes
		setTimeout(() => {
			container.classList.toggle('correct');
			questionAnswerPopupMsg.classList.toggle('show');
			//move to next question
			nextQuestion();
		}, 3000);
	} else {
		//add this answer to incorrectlyAnswered
		addData(incorrectlyAnswered, selectedAnswerText);

		//display that the choosen answer is incorrect
		container.classList.toggle('incorrect');

		//show popup
		questionAnswerPopupMsg.classList.toggle('show');
		questionAnswerPopupMsg.firstElementChild.textContent = `Sorry that is incorrect. The correct answer is:
		${correctAnswers[currentQuestionNum.value - 1]}`;

		//wait for 3 seconds and move to next question, remove toggled classes
		setTimeout(() => {
			container.classList.toggle('incorrect');
			questionAnswerPopupMsg.classList.toggle('show');

			//move to next question
			nextQuestion();
		}, 3000);
	}
}

function endGame() {
	//reset all global variables
	quizData = [];
	correctAnswers = [];
	incorrectAnswers = [];

	correctlyAnswered = [];
	incorrectlyAnswered = [];

	//reset the progress bar
	resetProgressBar();

	//display the game configuration menu on screen
	gameConfigurationScreen.classList.remove('done');
}

//Helper Functions//
const addData = (arr, el) => {
	arr.push(el);
};

const randomizeCorrectAnswer = () => {
	return Math.floor(Math.random() * 4);
};

const updateProgressBar = () => {
	//set the max value on the dom element according to the user inputed limit to the api call
	currentQuestionNum.max = quizData.length;
	//display the current question number and total questions
	currentQuestionNum.nextElementSibling.textContent = `${currentQuestionNum.value}/${quizData.length}`;
};

const resetProgressBar = () => {
	currentQuestionNum.max = quizData.length;
	currentQuestionNum.value = 1;

	currentQuestionNum.nextElementSibling.textContent = `${currentQuestionNum.value}/${quizData.length}`;
};

//TODO improve this
let show = true;
const checkboxes = document.getElementById('checkBoxes');

function showCheckboxes() {
	if (show) {
		checkboxes.style.display = 'block';
		show = false;
	} else {
		checkboxes.style.display = 'none';
		show = true;
	}
}

//TODO: implement endgame screen with score, number of correct answers, number of inccorect answers, play again button
function showEndGameScreen() {
	const correctAnswersDisplay = document.getElementById('correctAnswersDisplay');
	const incorrectAnswersDisplay = document.getElementById('incorrectAnswersDisplay');
	const playAgainButton = document.getElementById('play-again');

	correctAnswersDisplay.innerText = correctlyAnswered.length;
	incorrectAnswersDisplay.innerText = incorrectlyAnswered.length;

	endGameModal.classList.add('show');

	playAgainButton.addEventListener('click', ()=>{
		endGame();
		endGameModal.classList.remove('show');
	});

}

//TODO implement the QUIT button during game play
