const question = document.getElementById('question');
const answersText = document.querySelectorAll('p.answerText');
const answerContainers = document.querySelectorAll('.answer-wrapper');
const questionNumber = document.getElementById('questionNumber');
const modal = document.getElementById('modal');

const correctAnswers = [];
const incorrectAnswers = [];

fetchQuestions();
updateDOM();

//functions
async function fetchQuestions() {
	const quizData = [];
	const response = await fetch('https://the-trivia-api.com/api/questions?limit=5');
	const data = await response.json();

	/* console.log(data); */

	data.forEach((el) => {
		const fetchedData = {
			question: `${el.question}`,
			correctAnswer: `${el.correctAnswer}`,
			incorrectAnswers: [...el.incorrectAnswers],
		};

		addData(quizData, fetchedData);
		addData(correctAnswers, el.correctAnswer);
		addData(incorrectAnswers, el.incorrectAnswer);
	});

	/* console.log('1: ',quizData); */
	return quizData;
}

//pupulates the UI with the question and answers
async function updateDOM() {
	let providedData = await fetchQuestions();
	console.log('2: ', providedData);
	const questionNum = questionNumber.value - 1;

	providedData.forEach((element, elIndex) => {
		if (elIndex === questionNum) {
			//display the question on the page
			question.textContent = element.question;

			//randomize the position of the correct answer
			let correctAnswerPosition = randomizeCorrectAnswer();
			let counter = 0;

			answersText.forEach((answerText, index) => {
				if (index === correctAnswerPosition) {
					answerText.textContent = element.correctAnswer;
				} else {
					answerText.textContent = element.incorrectAnswers[counter];
					counter++;
				}
			});
		}
	});

	//set question number by progress slider
	questionNumber.nextElementSibling.textContent = `${questionNumber.value}/${questionNumber.max}`;
}

/* helper functions */
const addData = (arr, el) => {
	arr.push(el);
};

const randomizeCorrectAnswer = () => {
	return Math.floor(Math.random() * 4);
};

//event listeners
//check answer
answerContainers.forEach((answerContainer) => {
	answerContainer.addEventListener('click', () => {
		//check if selected answer is correct
		if (correctAnswers.includes(answerContainer.lastElementChild.textContent)) {
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
				questionNumber.value += 1;

				updateDOM();
			}, 3000);
		} else {
			//display that the choosen answer is incorrect
			answerContainer.classList.toggle('incorrect');

			//show popup
			modal.classList.toggle('show');
			modal.firstElementChild.textContent = `Sorry that is incorrect. The correct answer is:
            ${correctAnswers[questionNumber.value - 1]}`;

			//wait for 3 seconds and move to next question, remove toggled classes
			setTimeout(() => {
				answerContainer.classList.toggle('incorrect');
				modal.classList.toggle('show');

				//move to next question
				questionNumber.value += 1;

				updateDOM();
			}, 3000);
		}
	});
});
