//game setup assets
const startBtn = document.getElementById('start');
const startModal = document.getElementById('game-setup');
//game assets
const questionElement = document.getElementById('question');
const answersTextElement = document.querySelectorAll('p.answerText');
const answerContainers = document.querySelectorAll('.answer-wrapper');
const questionNumberElement = document.getElementById('questionNumber');
const modal = document.getElementById('modal');

const quizData = [];
const correctAnswers = [];
const incorrectAnswers = [];

//Event Listeners//
startBtn.addEventListener('click', (e) => {
	e.preventDefault();
	//get api options
	/* configureGame(); */
	//make api request for questions
	fetchQuestions();
	//hide game config modal
	startGame();
	//display the first questionscript.js
	populateUI();
});

/* window.onload = fetchQuestions();

window.onload = populateUI(); */
//check answer
answerContainers.forEach((answerContainer) => {
	answerContainer.addEventListener('click', (event) => {
		checkUsersAnswer(event);
	});
});

//Functions//

//fetches data from https://the-trivia-api.com
async function fetchQuestions() {
	const gameConfig = configureGame();
	const categories = gameConfig.categories;
	const limit = gameConfig.limit;
	const difficulty = gameConfig.difficulty;

	console.log(categories);
	console.log(limit);
	console.log(difficulty);

	//https://the-trivia-api.com/api/questions?categories=arts_and_literature,film_and_tv,food_and_drink,general_knowledge&limit=5&difficulty=hard
	const url = `https://the-trivia-api.com/api/questions?categories=${categories}&${limit}&${difficulty}`;
	const response = await fetch(url);
	const data = await response.json();

	data.forEach((el) => {
		const fetchedData = {
			questionText: `${el.question}`,
			correctAnswerText: `${el.correctAnswer}`,
			incorrectAnswersText: [...el.incorrectAnswers],
		};
		//add this element to global arrays
		addData(quizData, fetchedData);
		addData(correctAnswers, el.correctAnswer);
		addData(incorrectAnswers, el.incorrectAnswer);
	});
	return quizData;
}

function configureGame() {
	const categories = document.querySelectorAll('#categories option:checked');
	const numberOfQuestions = document.getElementById('number-of-questions');
	const gameDifficulty = document.querySelectorAll('#game-difficulty option:checked');

	let choosenCategories = [...categories].map((option) => option.value).join(',');
	let choosenQuestionNumber = numberOfQuestions.value;
	let choosengameDifficulty = [...gameDifficulty].map((option) => option.value).join();

	console.log('that');

	return {
		categories: choosenCategories,
		limit: choosenQuestionNumber,
		difficulty: choosengameDifficulty,
	};
}

function startGame() {
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
	const questionNum = questionNumberElement.value - 1;

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

	//depending on which part of the answer container is clicked get the clicked answer text
	if (event.target.classList.contains('answerText')) {
		selectedAnswerText = answerContainer.innerText.trim();
	} else if (event.target.classList.contains('answer-letter')) {
		let parentEl = answerContainer.parentElement;
		selectedAnswerText = parentEl.lastElementChild.innerText.trim();
	} else if (event.target.classList.contains('answer-wrapper')) {
		selectedAnswerText = answerContainer.lastElementChild.textContent.trim();
	}

	//check if selected answer is correct
	if (correctAnswers.includes(selectedAnswerText)) {
		//display that the choosen answer is correct
		answerContainer.classList.toggle('correct');

		//show popup
		modal.classList.toggle('show');
		modal.firstElementChild.textContent = `🎉 Congratulations that is correct 🎉`;

		//wait for 3 seconds and move to next question, remove toggled classes
		setTimeout(() => {
			answerContainer.classList.toggle('correct');
			modal.classList.toggle('show');
			//move to next question
			nextQuestion();
		}, 3000);
	} else {
		//display that the choosen answer is incorrect
		answerContainer.classList.toggle('incorrect');

		//show popup
		modal.classList.toggle('show');
		modal.firstElementChild.textContent = `Sorry that is incorrect. The correct answer is:
		${correctAnswers[questionNumberElement.value - 2]}`;

		//wait for 3 seconds and move to next question, remove toggled classes
		setTimeout(() => {
			answerContainer.classList.toggle('incorrect');
			modal.classList.toggle('show');

			//move to next question
			nextQuestion();
		}, 3000);
	}
}

//Helper Functions//
const addData = (arr, el) => {
	arr.push(el);
};

const randomizeCorrectAnswer = () => {
	return Math.floor(Math.random() * 4);
};

const updateProgressBar = () => {
	//display the current question number and total questions
	questionNumberElement.nextElementSibling.textContent = `${questionNumberElement.value}/${quizData.length}`;
	//increment the question index
	questionNumberElement.value += 1;

	//TODO: set the max value on the dom element according to the user inputed limit to the api call
};
