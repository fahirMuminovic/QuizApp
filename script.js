//game setup assetsionNumber
const startBtn = document.getElementById('start');
const startModal = document.getElementById('game-setup');
const numberOfQuestions = document.getElementById('number-of-questions');
const sliderValue = document.getElementById('range-slider-value');
//game assets
const questionElement = document.getElementById('question');
const answersTextElement = document.querySelectorAll('p.answerText');
const answerContainers = document.querySelectorAll('.answer-wrapper');
const questionNumberElement = document.getElementById('questionNumber');
const modal = document.getElementById('modal');
const endGameModal = document.getElementById('game-end-modal');
const quitButton = document.getElementById('quit-button');

let quizData = [];
let correctAnswers = [];
let incorrectAnswers = [];

let correctlyAnswered = [];
let incorrectlyAnswered = [];

//Event Listeners//
startBtn.addEventListener('click', (e) => {
	e.preventDefault();
	startGame();
});

numberOfQuestions.addEventListener('input', () => {
	sliderValue.innerText = numberOfQuestions.value;
});

window.onload = () => {
	numberOfQuestions.value = 10;
	sliderValue.innerText = numberOfQuestions.value;
};

answerContainers.forEach((answerContainer) => {
	//check answer
	answerContainer.addEventListener('click', (event) => {
		checkUsersAnswer(event);
	});
});

quitButton.addEventListener('click', quitGame);

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
	let choosenQuestionNumber = numberOfQuestions.value;
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
	//removes the modal used for game configuration on page load
	startModal.classList.add('done');
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
	const questionNum = questionNumberElement.value;

	if (questionNum === quizData.length) {
		endGame();
	}

	//increment the dom element in progress bar
	questionNumberElement.value += 1;

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
		modal.classList.toggle('show');
		modal.firstElementChild.textContent = `🎉 Congratulations that is correct 🎉`;

		//wait for 3 seconds and move to next question, remove toggled classes
		setTimeout(() => {
			container.classList.toggle('correct');
			modal.classList.toggle('show');
			//move to next question
			nextQuestion();
		}, 3000);
	} else {
		//add this answer to incorrectlyAnswered
		addData(incorrectlyAnswered, selectedAnswerText);

		//display that the choosen answer is incorrect
		container.classList.toggle('incorrect');

		//show popup
		modal.classList.toggle('show');
		modal.firstElementChild.textContent = `Sorry that is incorrect. The correct answer is:
		${correctAnswers[questionNumberElement.value - 1]}`;

		//wait for 3 seconds and move to next question, remove toggled classes
		setTimeout(() => {
			container.classList.toggle('incorrect');
			modal.classList.toggle('show');

			//move to next question
			nextQuestion();
		}, 3000);
	}
}

function quitGame() {
	quizData = [];
	correctAnswers = [];
	incorrectAnswers = [];

	resetProgressBar();

	startModal.classList.remove('done');
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
	questionNumberElement.max = quizData.length;
	//display the current question number and total questions
	questionNumberElement.nextElementSibling.textContent = `${questionNumberElement.value}/${quizData.length}`;
};

const resetProgressBar = () => {
	questionNumberElement.max = quizData.length;
	questionNumberElement.value = 1;

	questionNumberElement.nextElementSibling.textContent = `${questionNumberElement.value}/${quizData.length}`;
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

//TODO: implement endgame screen with score, number of correct answers, number of inccorect ansers, play again button
function endGame() {
	endGameModal.classList.add('show');
}

//TODO implement the QUIT button during game play
