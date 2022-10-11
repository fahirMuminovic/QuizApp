const question = document.getElementById('question');
const answers = document.querySelectorAll('p.answerText');
const questionNumber = document.getElementById('questionNumber');

const quizData = [];

const test = ['asdsfda', 'asdsfda', 'asdsfda', 'asdsfda'];

fetchQuestions();

async function fetchQuestions() {
	const response = await fetch('https://the-trivia-api.com/api/questions?limit=20');
	const data = await response.json();

	/* console.log(data); */

	data.forEach((el) => {
		const fetchedData = {
			question: `${el.question}`,
			correctAnswer: `${el.correctAnswer}`,
			incorrectAnswers: `${el.incorrectAnswers}`,
		};

		addData(fetchedData);
	});

	updateDOM(quizData);
}

function updateDOM(providedData = quizData) {
	const questionNum = questionNumber.value - 1;

	providedData.forEach((element, index) => {
		if (index === questionNum) {
			question.textContent = element.question;
			let correctAnwserPosition = randomizeCorrectAnswer();
			let counter = 0;
			const incorrectAnswersArr = element.incorrectAnswers.split(',');

			answers.forEach((answer, index) => {
				if (index === correctAnwserPosition) {
					answer.textContent = element.correctAnswer;
				} else {
					answer.textContent = incorrectAnswersArr[counter];
					counter++;
				}
			});
		}
	});
}

/* Helper functions */
const addData = (obj) => {
	quizData.push(obj);
};

const randomizeCorrectAnswer = () => {
	return Math.floor(Math.random() * 4);
};
