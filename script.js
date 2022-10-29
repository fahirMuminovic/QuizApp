const changeThemeBtn = document.getElementById('changeTheme');
//game setup assets
const startGameButton = document.getElementById('start');
const gameConfigurationScreen = document.getElementById('game-setup');
const choosenNumberOfQuestions = document.getElementById('number-of-questions');
const decrementNumberOfQuestionsBtn = document.querySelector('.decrement-input-type-number');
const incrementNumberOfQuestionsBtn = document.querySelector('.increment-input-type-number');
const allCategoriesCheckbox = document.getElementById('all');
const regionSelect = document.getElementById('region-selector');
const choosenNumberOfQuestionsSliderValue = document.getElementById('direct-number-input');
const selectGameDifficultyDropDown = document.querySelector('#multiselect');
const smallTagForDifficulty = document.getElementById('selected-difficulties-value');
//game assets
const questionElement = document.getElementById('question');
const answersTextElement = document.querySelectorAll('p.answerText');
const answerWrappers = document.querySelectorAll('.answer-wrapper');
const currentQuestionNum = document.getElementById('questionNumber');
const endGameModal = document.getElementById('game-end-modal');
const quitButton = document.getElementById('quit-button');
const overallTime = document.getElementById('overallTime');
const pointsDisplay = document.getElementById('points');

let quizData = [];
let correctAnswers = [];

let correctlyAnsweredCount = 0;
let incorrectlyAnsweredCount = 0;
let userScore = 0;
//holds the timer id
let overallTimer = 0;
let questionTimer = 0;

//get theme from local storage
let currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark-theme') {
	document.body.classList.add('dark-theme');
}

//Event Listeners//
//change web page theme
changeThemeBtn.addEventListener('click', () => {
	document.body.classList.toggle('dark-theme');

	let theme = 'light';
	if (document.body.classList.contains('dark-theme')) {
		theme = 'dark-theme';
	}
	localStorage.setItem('theme', theme);
});

//select all categories
allCategoriesCheckbox.addEventListener('click', () => {
	const categories = document.querySelectorAll('.categories-wrapper input');

	if (allCategoriesCheckbox.checked === true) {
		categories.forEach((category) => {
			category.checked = true;
		});
	} else {
		categories.forEach((category) => {
			category.checked = false;
		});
	}
});

//start game
startGameButton.addEventListener('click', (e) => {
	e.preventDefault();
	startGame();
	//start timer that tracks total time taken to finish the quiz
	overallTimer = setInterval(updateOverallTimer, 1000);
});

choosenNumberOfQuestions.addEventListener('input', () => {
	//update the display of chosen questions that is positioned below the slider
	choosenNumberOfQuestionsSliderValue.value = choosenNumberOfQuestions.value;
});

choosenNumberOfQuestionsSliderValue.addEventListener('change', () => {
	//update the display of chosen questions that is positioned below the slider
	choosenNumberOfQuestions.value = choosenNumberOfQuestionsSliderValue.value;
	if (choosenNumberOfQuestionsSliderValue.value > 50) {
		choosenNumberOfQuestionsSliderValue.value = 50;
	}
});
//decrement button by input[type='number']
decrementNumberOfQuestionsBtn.addEventListener('click', (e) => {
	choosenNumberOfQuestions.value--;
	choosenNumberOfQuestionsSliderValue.value--;
});
//inrement button by input[type='number']
incrementNumberOfQuestionsBtn.addEventListener('click', (e) => {
	choosenNumberOfQuestions.value++;
	choosenNumberOfQuestionsSliderValue.value++;
});

window.onload = () => {
	//set the default value for number of questions to 10
	choosenNumberOfQuestions.value = 10;
	choosenNumberOfQuestionsSliderValue.value = choosenNumberOfQuestions.value;
	//display selected difficulties in small tag
	updateSelectedDifficultiesSmallTag();
	//display selected region in small tag
	document.getElementById(
		'selected-region-value'
	).textContent = `Selected: ${regionSelect.selectedOptions[0].innerText}`;
};

regionSelect.addEventListener('input', () => {
	document.getElementById(
		'selected-region-value'
	).textContent = `Selected: ${regionSelect.selectedOptions[0].innerText}`;
});

answerWrappers.forEach((answerContainer) => {
	//check answer
	answerContainer.addEventListener('click', (event) => {
		checkUsersAnswer(event);
	});
});

quitButton.addEventListener('click', () => {
	showEndGameScreen();
});

/* if user clicks div with game difficulties, open it. If user click out of that div then close it */
document.addEventListener('click', (e) => {
	const gameDifficultyOptions = document.querySelector('#gameDifficultyOptions');
	const multiselect = document.querySelector('#multiselect');
	const selectBox = document.querySelector('#selectBox');
	const overSelect = document.querySelector('.overSelect');
	const [easy, medium, hard] = [...document.querySelectorAll('#gameDifficultyOptions input')];

	if (
		e.target === gameDifficultyOptions ||
		e.target === easy ||
		e.target === medium ||
		e.target === hard
	) {
		gameDifficultyOptions.classList = 'show';
	} else if (e.target === multiselect || e.target === selectBox || e.target === overSelect) {
		gameDifficultyOptions.classList.toggle('show');
	} else {
		gameDifficultyOptions.classList = '';
	}
});

selectGameDifficultyDropDown.addEventListener('change', updateSelectedDifficultiesSmallTag);

//Functions//

//makes url for fetch API depending on user game configuration
async function prepareUrls() {
	const gameConfig = await configureGame();
	const categories = gameConfig.categories;
	const limit = Number(gameConfig.limit);
	const difficulty = gameConfig.difficulty;
	const region = regionSelect.selectedOptions[0].value;
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
			`https://the-trivia-api.com/api/questions?categories=${categories}&limit=${limit1}&region=${region}&difficulty=${difficulty1}`
		);
		//make url for limit2 dificulty2 and push to urls array
		urls.push(
			`https://the-trivia-api.com/api/questions?categories=${categories}&limit=${limit2}&region=${region}&difficulty=${difficulty2}`
		);
	}
	//for no dificulty selected leave it out from url, so we get questions of all dificulties
	else if (difficulty.length === 0) {
		urls.push(
			`https://the-trivia-api.com/api/questions?categories=${categories}&limit=${limit}&region=${region}`
		);

		//if only one difficulty is selected cast it to string and use in API call
	} else if (difficulty.length === 1) {
		urls.push(
			`https://the-trivia-api.com/api/questions?categories=${categories}&limit=${limit}&region=${region}&difficulty=${String(
				difficulty
			)}`
		);
	}
	return urls;
}

//fetches data from https://the-trivia-api.com
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
				correctAnswerText: `${el.correctAnswer}`,
				incorrectAnswersText: [...el.incorrectAnswers],
			};
			//add this element to global arrays
			addData(quizData, fetchedData);
			addData(correctAnswers, el.correctAnswer);
		});
	}
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
	const checkboxAllCategories = document.querySelector('#all');

	//get the user configurations for the game and format them
	let choosenCategories = [...categories].map((option) => option.value).join(',');
	let choosenQuestionNumber = choosenNumberOfQuestions.value;
	let choosengameDifficulty = [...gameDifficulty].map((option) => option.value);

	//if no particular category is choosen then use all categories
	choosenCategories = choosenCategories === '' ? allCategories.join(',') : choosenCategories;

	//all categories checkbox is checked
	if (checkboxAllCategories.checked) {
		choosenCategories = allCategories.join(',');
	}

	//if you make a request to the API with difficulty left out, you get questions of all difficulties
	choosengameDifficulty = choosengameDifficulty.length === 3 ? [] : choosengameDifficulty;

	return {
		categories: choosenCategories,
		limit: choosenQuestionNumber,
		difficulty: choosengameDifficulty,
	};
}

async function startGame() {
	toggleLoadingIcon();
	//make sure that the UI is populated
	await populateUI();
	//removes the screen used for game configuration on page load
	gameConfigurationScreen.classList.add('done');
	toggleLoadingIcon();
	document.getElementById('game-elements').classList.add('show');
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
	//start question timer
	startQuestionTimer();
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
	//start question timer
	startQuestionTimer();
}

function displayQuestionCategory(questionCategory) {
	const categoryContainerEl = document.getElementById('categoryDisplay');
	categoryContainerEl.textContent = questionCategory;
}

//add score if answer is correct, also displays it on page
function addScore() {
	userScore += getQuestionPoints();

	pointsDisplay.textContent = `${userScore} PTS`;
}

function getQuestionPoints() {
	const questionDifficulty = quizData[currentQuestionNum.value - 1].questionDifficulty;

	if (questionDifficulty === 'easy') {
		points = 100;
	}
	if (questionDifficulty === 'medium') {
		points = 250;
	} else if (questionDifficulty === 'hard') {
		points = 500;
	}

	return points;
}

function toggleScoreAnimation() {
	const currentQuestionPointsEl = document.querySelector('.current-question-points');
	currentQuestionPointsEl.textContent = `+${getQuestionPoints()} PTS`;

	if (currentQuestionPointsEl.classList.contains('show')) {
		currentQuestionPointsEl.classList.remove('show');
		currentQuestionPointsEl.classList.remove('fade');
	} else {
		currentQuestionPointsEl.classList.add('show');
		currentQuestionPointsEl.classList.add('fade');
	}
}

function checkUsersAnswer(event) {
	//this is to stop the user from clicking multiple times on answers
	document.addEventListener('click', handler, true);
	function handler(e) {
		e.stopPropagation();
		e.preventDefault();
	}

	//stop the question timer
	document.getElementById('question-timer').classList.remove('start');
	clearInterval(questionTimer);

	//get clicked answer container
	let answerContainer = event.target;
	let selectedAnswerText = '';
	let container = undefined;

	//depending on which part of the answer container is clicked get the clicked answer text
	if (answerContainer.classList.contains('answerText')) {
		container = answerContainer.parentElement;
		selectedAnswerText = answerContainer.innerText;
	} else if (answerContainer.classList.contains('answer-letter')) {
		container = answerContainer.parentElement;
		selectedAnswerText = container.lastElementChild.innerText;
	} else if (answerContainer.classList.contains('answer-wrapper')) {
		container = answerContainer;
		selectedAnswerText = answerContainer.lastElementChild.textContent;
	}

	//check if selected answer is correct
	if (correctAnswers.includes(selectedAnswerText)) {
		toggleBusyCursorDisplay();
		toggleScoreAnimation();
		//mark this answer as correctlyAnswered
		correctlyAnsweredCount++;
		//display that the choosen answer is correct
		container.classList.add('correct');

		//update user score
		setTimeout(() => {
			addScore();
		}, 1000);

		//wait for 3 seconds and move to next question, remove toggled classes
		setTimeout(() => {
			//show score animation
			toggleScoreAnimation();
			container.classList.remove('correct');

			//enable click again
			document.removeEventListener('click', handler, true);
			toggleBusyCursorDisplay();

			//move to next question
			nextQuestion();
		}, 1500);
	} else {
		toggleBusyCursorDisplay();
		//mark this answer as incorrectlyAnswered
		incorrectlyAnsweredCount++;

		//display that the choosen answer is incorrect, also display the correct answer
		answerWrappers.forEach((answerContainer) => {
			if (correctAnswers.includes(answerContainer.children[2].innerText)) {
				answerContainer.classList.add('correct');
			} else {
				answerContainer.classList.add('incorrect');
			}
		});

		//wait for 3 seconds and move to next question, remove toggled classes
		setTimeout(() => {
			//reset correct and incorrect classes on answer container elements
			resetAnswerWrappers();

			//enable clicks again
			document.removeEventListener('click', handler, true);
			toggleBusyCursorDisplay();

			//move to next question
			nextQuestion();
		}, 1500);
	}
}

function endGame() {
	//reset all global variables
	quizData = [];
	correctAnswers = [];

	correctlyAnsweredCount = 0;
	incorrectlyAnsweredCount = 0;

	userScore = 0;
	clearInterval(overallTimer);
	clearInterval(questionTimer);

	//reset the progress bar
	resetProgressBar();

	//reset the overall time
	overallTime.textContent = '';
	//reset the points
	pointsDisplay.textContent = '0 PTS';

	//reset answer container classes
	resetAnswerWrappers();

	//display the game configuration menu on screen
	gameConfigurationScreen.classList.remove('done');
}

function showEndGameScreen() {
	//hide the game screen
	document.getElementById('game-elements').classList.remove('show');
	//for animating start screen if user clicks play again
	const gameStartScreen = document.getElementById('game-setup');
	//stop timers
	clearInterval(overallTimer);
	clearInterval(questionTimer);
	//format the time that is displayed
	formatTime(overallTime);

	const correctAnswersDisplay = document.getElementById('correctAnswersDisplay');
	const incorrectAnswersDisplay = document.getElementById('incorrectAnswersDisplay');
	const playAgainButton = document.getElementById('play-again');
	const score = document.getElementById('score');

	score.textContent = `${userScore} PTS`;
	correctAnswersDisplay.innerText = correctlyAnsweredCount;
	incorrectAnswersDisplay.innerText = incorrectlyAnsweredCount;

	endGameModal.classList.add('show');

	playAgainButton.addEventListener('click', () => {
		endGame();
		if (!gameStartScreen.classList.contains('animate-bottom')) {
			gameStartScreen.classList.add('animate-bottom');
		}
		endGameModal.classList.remove('show');
	});
}

function showCorrectAnswer() {
	//this is to stop the user from clicking multiple times on answers
	document.addEventListener('click', handler, true);
	function handler(e) {
		e.stopPropagation();
		/* e.stopImmediatePropagation(); */
		e.preventDefault();
	}

	clearInterval(questionTimer);

	toggleBusyCursorDisplay();

	let corrAnswerContainer = undefined;

	answerWrappers.forEach((answerContainer) => {
		if (correctAnswers.includes(answerContainer.children[2].innerText)) {
			corrAnswerContainer = answerContainer;
			corrAnswerContainer.classList.add('correct');
		}
	});
	//mark this question as incorrectly answered
	incorrectlyAnsweredCount++;

	setTimeout(() => {
		//remove the class correct from answer wrapper
		resetAnswerWrappers();
		document.removeEventListener('click', handler, true);
		toggleBusyCursorDisplay();
		nextQuestion();
	}, 1500);
}

//Helper Functions//
const addData = (arr, el) => {
	arr.push(el);
};

const resetAnswerWrappers = () => {
	answerWrappers.forEach((answerWrapper) => {
		answerWrapper.classList = 'answer-wrapper';
	});
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

function toggleBusyCursorDisplay() {
	document.getElementById('answers-container').classList.toggle('change-cursor');
}

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

const updateOverallTimer = () => {
	overallTime.textContent = Number(overallTime.textContent) + 1;
};

const formatTime = (timeDOMElement) => {
	const time = Number(timeDOMElement.textContent);

	let hours = Math.floor(time / 3600).toString();
	let minutes = Math.floor((time % 3600) / 60)
		.toString()
		.padStart(2, '0');
	let seconds = Math.floor(time % 60)
		.toString()
		.padStart(2, '0');

	if (time <= 59) {
		timeDOMElement.textContent = `${time} seconds`;
	} else if (time >= 60 && time < 3600) {
		timeDOMElement.textContent = `${minutes}:${seconds}`;
	} else if (time >= 3600) {
		timeDOMElement.textContent = `${hours}:${minutes}:${seconds}`;
	}
};

const toggleLoadingIcon = () => {
	document.getElementById('loadingScreen').classList.toggle('show');
};

const startQuestionTimer = (time = 20) => {
	if (endGameModal.classList.contains('show')) {
		return 0;
	}

	document.getElementById('question-timer').classList.add('start');
	questionTimer = setInterval(() => {
		time--;
		if (time <= 0) {
			showCorrectAnswer();
			clearInterval(questionTimer);
			document.getElementById('question-timer').classList.remove('start');
		}
	}, 1000);
};

function updateSelectedDifficultiesSmallTag() {
	const gameDifficulty = Array.from(
		document.querySelectorAll('#gameDifficultyOptions input:checked')
	);

	const smallTagForDifficultyText = gameDifficulty
		.map((gameDifficultyOption) => {
			return gameDifficultyOption.attributes['aria-label'].value;
		})
		.join(', ');

	smallTagForDifficulty.textContent = `Selected: ${smallTagForDifficultyText}`;
}
