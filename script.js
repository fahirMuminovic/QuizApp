const questionElement = document.getElementById('question');
const answersTextElement = document.querySelectorAll('p.answerText');
const answerContainers = document.querySelectorAll('.answer-wrapper');
const questionNumberElement = document.getElementById('questionNumber');
const modal = document.getElementById('modal');

const quizData = [];
const correctAnswers = [];
const incorrectAnswers = [];

//Event Listeners//
//make api request for questions
window.onload = fetchQuestions();
//display the first question
window.onload = populateUI();
//check answer
answerContainers.forEach((answerContainer) => {
	answerContainer.addEventListener('click', (event) => {
		checkUsersAnswer(event);
	});
});

//functions

//fetches data from https://the-trivia-api.com
async function fetchQuestions() {
	const response = await fetch('https://the-trivia-api.com/api/questions?limit=5&region=BA');
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

//pupulates the UI with the question and answers on initial page load
async function populateUI() {
	let providedData = await fetchQuestions();
	let firstQuestion = providedData[0];

	console.log('2: ', providedData);

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
