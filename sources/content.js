console.log("Liberar Prova Extension!")

/// dictionary with the courses data
var CURSOS = {}

/// fetches all course data attached to this extension
const url = chrome.runtime.getURL('/resources/cursos.json');
fetch(url)
	.then((response) => response.json())
	.then((json) => {
		CURSOS = json

		/// wait a second to populate table
		setTimeout(populateTable, 1000)

	});

function populateTable() {
	/// gets table element on page (hopefully it's loaded)
	tableElem = document.getElementById("table-disciplinas-reposicao")

	/// for each row in table
	for (var i = 0; i < tableElem.rows.length; i++) {
		/// store's current row element
		currentRow = tableElem.rows[i]

		/// if it has linha-disciplina as it's class
		if (currentRow.getAttribute("class") === "linha-disciplina") {
			/// get columns elements of row
			tdListElem = currentRow.getElementsByTagName("td")

			/// get disciplina information from column
			inputListElem = currentRow.getElementsByTagName("input")

			/// correcting for some bulshit the site does
			if (tdListElem[2].children[0].innerHTML === "Liberada") {
				tdIndex = tdListElem.length - 1
			} else {
				tdIndex = tdListElem.length - 2
			}

			/// get status column of row
			statusTd = tdListElem[tdIndex]
			/// store id of Disciplina
			idDisciplina = inputListElem[0].value

			/// if it's a enabled class
			if (tdListElem[2].children[0].innerHTML !== "Bloqueada") {

				/// set class to center text within
				statusTd.setAttribute("class", "text-center")

				/// creat a anchor tag as button
				aTag = document.createElement("a")
				aTag.innerHTML = "Liberar Prova"
				aTag.setAttribute("href", "javascript:void(0);")

				/// setup button function when pressed
				let idDisciplinaAtual = String(idDisciplina)
				aTag.addEventListener("click", () => {
					liberarProva(idDisciplinaAtual)
				}, false);

				statusTd.appendChild(aTag)
			}
		}
	}
}

/// gets Curso name by it's id
function getCursoNomeByCursoId(idCurso) {
	/// for each key in Cursos
	for (var curso of Object.keys(CURSOS)) {
		/// if current key equals
		if (String(idCurso) === String(CURSOS[curso].IdCurso)) {
			return curso
		}
	}

	return undefined
}

/// gets index of Disciplina by it's Id
function getIndexDiscByDisciplinaId(idCurso, idDisciplina) {
	cursoNome = getCursoNomeByCursoId(idCurso)

	if (cursoNome !== undefined) {
		for (var i = 0; i < CURSOS[cursoNome].Disciplinas.length; i++) {
			if (String(idDisciplina) === String(CURSOS[cursoNome].Disciplinas[i].IdDisciplina)) {
				return i
			}
		}
	}

	return undefined
}

function liberarProva(idDisciplina) {
	idUsuario = IdUsuario.value
	idTrilha = IdTrilha.value
	idCurso = IdCurso.value

	cursoNome = getCursoNomeByCursoId(idCurso)
	indexDisciplina = getIndexDiscByDisciplinaId(idCurso, idDisciplina)

	if (CURSOS[cursoNome] !== undefined) {

		for (var i = 0; i < CURSOS[cursoNome].Disciplinas[indexDisciplina].Unidades.length; i++) {
			unidade = CURSOS[cursoNome].Disciplinas[indexDisciplina].Unidades[i]

			// console.log(unidade)

			if (!unidade.Titulo.includes("Avaliativa")) {
				// console.log("Não prova")
				for (var atividade of unidade.Atividades) {
					console.log(atividade)
					registraAtividade(idTrilha, idCurso, idDisciplina, String(unidade.IdUnidade), String(atividade.IdAtividade), String(idUsuario))
				}
			}
		}
	}
}

function registraAtividade(idTrilha, idCurso, idDisciplina, idUnidade, idAtividade, idUsuario) {

	$("#carregando").show();
	$(".container-carregamento").show();

	$(document).ajaxStart(function() {
		$("#carregando").fadeIn();
		$(".container-carregamento").fadeIn();
	});

	var url = "https://enter.azure-api.net//api/Registro/AddRegistro";

	body = {
		Token: '90b0b515759f369e41fa67f2e92a43e8',
		IdTrilha: idTrilha,
		IdCurso: idCurso,
		IdDisciplina: idDisciplina,
		IdUnidade: idUnidade,
		IdAtividade: idAtividade,
		IdRegistroTipo: '7',
		IdUsuario: idUsuario,
		DescricaoRegistro: 'Atividade Finalizada',
		IdRegistroOrigem: 2
	}

	console.log(body)

	$.ajax({
		type: "POST",
		dataType: "json",
		data: body,
		url: url,
		success: function(resposta) {
			console.log(resposta)
			window.location.reload(false);
		},
		fail: function(argument) {
			console.log(resposta)
			alert("Erro ao liberar aula")
		}
	});
}