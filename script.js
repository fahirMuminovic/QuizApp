/**
 * TODO
 *
 * 1. display question category during game-play
 * 2. change the way correct and incorrect answers are displayed
 * 3. implement time tracking for overall quiz time
 * 4. implement a time limit for answering questions (possibly display as a loading bar)
 * 5. display current score during gameplay (possibly add animation on change)
 * 6. make a loading icon for change between game configuration screen and game-play
 */

//game setup assetsionNumber
const startGameButton = document.getElementById('start');
const gameConfigurationScreen = document.getElementById('game-setup');
const choosenNumberOfQuestions = document.getElementById('number-of-questions');
const choosenNumberOfQuestionsSliderValue = document.getElementById('range-slider-value');
const selectGameDifficultyDropDown = document.getElementById('multiselect');
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

let correctlyAnswered = [];
let incorrectlyAnswered = [];
let userScore = 0;

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

selectGameDifficultyDropDown.addEventListener('click', () => {
	selectGameDifficultyDropDown.lastElementChild.classList.toggle('show');
});

//Functions//

//fetches data from https://the-trivia-api.com
async function prepareUrls() {
	const gameConfig = await configureGame();
	const categories = gameConfig.categories;
	const limit = Number(gameConfig.limit);
	const difficulty = gameConfig.difficulty;
	const urls = [];

	//if user selected 2 difficulties, fetch API need to be called 2 times
	if (difficulty.length === 2) {
		//get dificulties
		let [difficulty1, difficulty2] = [...difficulty];
		//split limit 2 random ways
		let limit1 = Math.floor(Math.random() * limit);
		let limit2 = limit - limit1;

		//make url for limit1 dificulty1 and push to urls array
		urls.push(
			`https://the-trivia-api.com/api/questions?categories=${categories}&limit=${limit1}&difficulty=${difficulty1}`
		);
		//make url for limit2 dificulty2 and push to urls array
		urls.push(
			`https://the-trivia-api.com/api/questions?categories=${categories}&limit=${limit2}&difficulty=${difficulty2}`
		);
	}
	//for no dificulty selected leave it out from url, so we get questions of all dificulties
	else if (difficulty.length === 0) {
		urls.push(`https://the-trivia-api.com/api/questions?categories=${categories}&limit=${limit}`);

		//if only one difficulty is selected cast it to string and use in API call
	} else if (difficulty.length === 1) {
		urls.push(
			`https://the-trivia-api.com/api/questions?categories=${categories}&limit=${limit}&difficulty=${String(
				difficulty
			)}`
		);
	}
	return urls;
}

async function fetchQuestions() {
	const URLs = await prepareUrls();

	for (let i = 0; i < URLs.length; i++) {
		const url = URLs[i];

		const response = await fetch(url);
		const data = await response.json();

		data.forEach((el) => {
			const fetchedData = {
				questionText: `${el.question}`,
				questionDifficulty: `${el.difficulty}`,
				questionCategory: `${el.category}`,
				correctAnswerText: `${el.correctAnswer.trim()}`,
				incorrectAnswersText: [...el.incorrectAnswers],
			};
			//add this element to global arrays
			addData(quizData, fetchedData);
			addData(correctAnswers, el.correctAnswer);
		});
	}
	//TODO test to see of shuffleArray needs to be async
	//shuffle the final array
	return await shuffleArray(quizData);
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
	const categories = document.querySelectorAll('.categories-wrapper input:checked');
	const gameDifficulty = document.querySelectorAll('#gameDifficultyOptions input:checked');

	//get the user configurations for the game and format them
	let choosenCategories = [...categories].map((option) => option.value).join(',');
	let choosenQuestionNumber = choosenNumberOfQuestions.value;
	let choosengameDifficulty = [...gameDifficulty].map((option) => option.value);
	console.log(choosenCategories);
	//if no particular category is choosen then use all categories
	choosenCategories = choosenCategories === '' ? allCategories.join(',') : choosenCategories;
	//if you make a request to the API with difficulty left out, you get questions of all difficulties
	choosengameDifficulty = choosengameDifficulty.length === 3 ? [] : choosengameDifficulty;

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
	//display the question category
	displayQuestionCategory(firstQuestion.questionCategory);
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

	questions.forEach((question, elIndex) => {
		if (elIndex === questionNum) {
			//display the question on the page
			questionElement.textContent = question.questionText;
			//display question category
			displayQuestionCategory(question.questionCategory);
			//display the possible answers
			displayPossibleAnswers(question);
		}
	});
	updateProgressBar();
}

function displayQuestionCategory(questionCategory) {
	const categoryContainerEl = document.getElementById('categoryDisplay');
	categoryContainerEl.textContent = questionCategory;
}

function addScore() {
	let questionDifficulty = quizData[currentQuestionNum.value].questionDifficulty;

	if (questionDifficulty === 'easy') {
		userScore += 100;
	}
	if (questionDifficulty === 'medium') {
		userScore += 250;
	} else if (questionDifficulty === 'hard') {
		userScore += 500;
	}
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

		//update user score
		addScore();

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
		${quizData[currentQuestionNum.value - 1].correctAnswerText}`;

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

	correctlyAnswered = [];
	incorrectlyAnswered = [];

	//reset the progress bar
	resetProgressBar();

	//display the game configuration menu on screen
	gameConfigurationScreen.classList.remove('done');
}

function showEndGameScreen() {
	const correctAnswersDisplay = document.getElementById('correctAnswersDisplay');
	const incorrectAnswersDisplay = document.getElementById('incorrectAnswersDisplay');
	const playAgainButton = document.getElementById('play-again');
	const score = document.getElementById('score');

	score.innerText = `${userScore} PTS`;
	correctAnswersDisplay.innerText = correctlyAnswered.length;
	incorrectAnswersDisplay.innerText = incorrectlyAnswered.length;

	endGameModal.classList.add('show');

	playAgainButton.addEventListener('click', () => {
		endGame();
		endGameModal.classList.remove('show');
	});
}

//Helper Functions//
const addData = (arr, el) => {
	arr.push(el);
};

async function shuffleArray(array) {
	let currentIndex = array.length,
		randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex != 0) {
		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
	return array;
}

const randomizeCorrectAnswer = () => {
	return Math.floor(Math.random() * 4);
};

const updateProgressBar = () => {
	//set the max value on the dom element according to the user inputed limit to the api call
	currentQuestionNum.max = quizData.length;
	//increment the dom element in progress bar
	currentQuestionNum.value += 1;
	//display the current question number and total questions
	currentQuestionNum.nextElementSibling.textContent = `${currentQuestionNum.value}/${quizData.length}`;
};

const resetProgressBar = () => {
	currentQuestionNum.max = quizData.length;
	currentQuestionNum.value = 0;

	currentQuestionNum.nextElementSibling.textContent = `${currentQuestionNum.value + 1}/${
		quizData.length
	}`;
};
