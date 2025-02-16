let currentPage = 1;
let recordsPerPage = 3;
let totalRecords = 0;

const races = ['HUMAN', 'DWARF', 'ELF', 'GIANT', 'ORC', 'TROLL', 'HOBBIT'];
const professions = ['WARRIOR', 'ROGUE', 'SORCERER', 'CLERIC', 'PALADIN', 'NAZGUL', 'WARLOCK', 'DRUID'];

function fetchTotalRecords() {
    return fetch('/rest/players/count')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            totalRecords = data;
            document.getElementById('totalRecordsInfo').textContent = `Total records: ${totalRecords}`;
            updatePaginationControls();
            return data;
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            return 0;
        });
}

function fetchAndDisplayPlayers() {
    const offset = (currentPage - 1) * recordsPerPage;
    fetch(`/rest/players?pageNumber=${currentPage - 1}&pageSize=${recordsPerPage}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.querySelector('#playerTable tbody');
            tableBody.innerHTML = '';

            data.forEach((player) => {
                const row = document.createElement('tr');
                row.id = `row-${player.id}`;
                row.innerHTML = `
                    <td>${player.id}</td>
                    <td><span id="name-${player.id}">${player.name}</span></td>
                    <td><span id="title-${player.id}">${player.title}</span></td>
                    <td><span id="race-${player.id}">${player.race}</span></td>
                    <td><span id="profession-${player.id}">${player.profession}</span></td>
                    <td>${player.level}</td>
                    <td>${new Date(player.birthday).toLocaleDateString()}</td>
                    <td><span id="banned-${player.id}">${player.banned ? 'Yes' : 'No'}</span></td>
                    <td class="action-cell">
                    <button class="action-button" onclick="enableEditing(${player.id})">
                    <img src="/img/edit.png" alt="Edit Icon" class="icon">
                    Edit
                    </button>
                    </td>
                    <td class="action-cell">
                    <button class="action-button" onclick="handleDeleteClick(${player.id})">
                    <img src="/img/delete.png" alt="Delete Icon" class="icon">
                    Delete
                    </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            updatePaginationControls();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function updatePaginationControls() {
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchAndDisplayPlayers();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(totalRecords / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            fetchAndDisplayPlayers();
        }
    });

    document.getElementById('recordsPerPage').addEventListener('change', (event) => {
        recordsPerPage = parseInt(event.target.value, 10);
        currentPage = 1;
        fetchTotalRecords().then(() => {
            fetchAndDisplayPlayers();
        });
    });

    document.addEventListener('DOMContentLoaded', () => {
        fetchTotalRecords().then(() => {
            fetchAndDisplayPlayers();
        });
    });

function handleDeleteClick(playerId) {
    const userConfirmed = confirm("Are you sure you want to delete this account?");
    if (userConfirmed) {
        deletePlayer(playerId);
    }
}

function deletePlayer(playerId) {
    fetch(`/rest/players/${playerId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            totalRecords--;
            document.getElementById('totalRecordsInfo').textContent = `Total records: ${totalRecords}`;
            fetchAndDisplayPlayers();
        } else {
            alert("An error occurred while deleting the account.");
        }
    })
    .catch(error => {
        console.error('Error executing delete request:', error);
        alert("An error occurred while deleting the account.");
    });
}

function enableEditing(playerId) {
    const row = document.getElementById(`row-${playerId}`);
    const cells = row.getElementsByTagName('td');

    const name = cells[1].innerText;
    cells[1].innerHTML = `<input type="text" value="${name}" id="name-${playerId}">`;

    const title = cells[2].innerText;
    cells[2].innerHTML = `<input type="text" value="${title}" id="title-${playerId}">`;

    const race = cells[3].innerText.trim();
    const profession = cells[4].innerText.trim();

    const raceSelect = document.createElement('select');
    raceSelect.id = `race-${playerId}`;
    populateSelect(raceSelect, races);
    raceSelect.value = race;
    cells[3].innerHTML = '';
    cells[3].appendChild(raceSelect);

    const professionSelect = document.createElement('select');
    professionSelect.id = `profession-${playerId}`;
    populateSelect(professionSelect, professions);
    professionSelect.value = profession;
    cells[4].innerHTML = '';
    cells[4].appendChild(professionSelect);

    const banned = cells[7].innerText === 'Yes';
    cells[7].innerHTML = `<input type="checkbox" id="banned-${playerId}" ${banned ? 'checked' : ''}>`;

    const editButton = cells[8].getElementsByTagName('button')[0];
    editButton.innerHTML = `
    <img src="/img/save.png" alt="Save Icon" class="icon">
    Save
    `;
    editButton.onclick = function() { saveChanges(playerId); };
}

function saveChanges(playerId) {
    const name = document.getElementById(`name-${playerId}`).value;
    const title = document.getElementById(`title-${playerId}`).value;
    const race = document.getElementById(`race-${playerId}`).value;
    const profession = document.getElementById(`profession-${playerId}`).value;
    const banned = document.getElementById(`banned-${playerId}`).checked;

    const updatedData = {
        name: name,
        title: title,
        race: race,
        profession: profession,
        banned: banned
    };

    fetch(`/rest/players/${playerId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    })
    .then(response => {
        if (response.ok) {
            fetchAndDisplayPlayers();
        } else {
            alert("An error occurred while saving changes.");
        }
    })
    .catch(error => {
        console.error('Error sending request:', error);
        alert("An error occurred while saving changes.");
    });
}

function populateSelect(selectElement, options) {
    selectElement.innerHTML = '';
    options.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText.toUpperCase();
        option.textContent = optionText;
        selectElement.appendChild(option);
  });
}

document.addEventListener('DOMContentLoaded', function() {
    const raceSelect = document.getElementById('race');
    const professionSelect = document.getElementById('profession');
    const messageDiv = document.getElementById('message');

    populateSelect(raceSelect, races);
    populateSelect(professionSelect, professions);

    document.getElementById('createPlayerForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            title: document.getElementById('title').value,
            race: raceSelect.value,
            profession: professionSelect.value,
            level: parseInt(document.getElementById('level').value),
            birthday: new Date(document.getElementById('birthday').value).getTime(),
            banned: document.getElementById('banned').checked
        };

    fetch('/rest/players', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('createPlayerForm').reset();
            showMessage('Account successfully created!', 'success');
        } else {
            showMessage('Error creating account: Please check that all required fields are correct.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred while sending data. Try again later.', 'error');
    });
  });

function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.style.display = 'block';

    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
});
