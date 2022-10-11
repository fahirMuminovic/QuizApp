const question = document.getElementById('question');
const answersText = document.querySelectorAll('p.answerText');
const answerContainers = document.querySelectorAll('.answer-wrapper');
const questionNumber = document.getElementById('questionNumber');
const modal = document.getElementById('modal');

const quizData = [];
const correctAnswers = [];
const incorrectAnswers = [];

fetchQuestions();

//functions
async function fetchQuestions() {
	const response = await fetch('https://the-trivia-api.com/api/questions?limit=20');
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

	updateDOM(quizData);
}

//pupulates the UI with the question and answers
function updateDOM(providedData = quizData) {
	const questionNum = questionNumber.value - 1;

	providedData.forEach((element, index) => {
		if (index === questionNum) {
            //display the question on the page
			question.textContent = element.question;

            //randomize the position of the correct answer
			let correctAnwserPosition = randomizeCorrectAnswer();
			let counter = 0;

			answersText.forEach((answer, index) => {
				if (index === correctAnwserPosition) {
					answer.textContent = element.correctAnswer;
				} else {
					answer.textContent = element.incorrectAnswers[counter];
					counter++;
				}
			});
		}
	});

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
	answerContainer.addEventListener('click', (event) => {
		if (correctAnswers.includes(answerContainer.lastElementChild.textContent)) {
			answerContainer.classList.add('correct');

            modal.classList.toggle('show');
			modal.firstElementChild.textContent = `🎉 Congratulations that is correct 🎉`;

			questionNumber.value += 1;

			setTimeout(() => {
				answerContainer.classList.remove('correct');
                modal.classList.toggle('show');
				updateDOM();
			}, 3000);
		} else {
			answerContainer.classList.add('incorrect');

			modal.classList.toggle('show');
			modal.firstElementChild.textContent = `Sorry that is incorrect. The correct answer is:
            ${correctAnswers[questionNumber.value - 1]}
            `;

			questionNumber.value += 1;

			setTimeout(() => {
				answerContainer.classList.remove('incorrect');
				modal.classList.toggle('show');
				updateDOM();
			}, 3000);
		}
	});
});
