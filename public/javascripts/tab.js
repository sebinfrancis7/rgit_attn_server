var list = [];
var subject;

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

async function buildTable(data) {
    let tableHeader = document.querySelector(".table-header");
    let tableBody = document.querySelector(".table-body");

    let tableName = document.createElement("th");
    tableName.className = "colm";
    tableName.innerHTML = "Name";
    tableHeader.appendChild(tableName);

    let tableRoll = document.createElement("th");
    tableRoll.className = "colm";
    tableRoll.innerHTML = "Roll No.";
    tableHeader.appendChild(tableRoll);

    for (attn of data[0].attn) {
        let tableRoll = document.createElement("th");
        tableRoll.className = "colm date";
        tableRoll.setAttribute('aria-label', attn.id);
        let d = new Date(attn.date);
        tableRoll.innerHTML = d.toLocaleString('en-US', {
            timeStyle: "short",
            dateStyle: "short"
        });
        tableHeader.appendChild(tableRoll);
    }

    let lect = data[0].attn.length;
    let tableTotal = document.createElement("th");
    tableTotal.className = "colm";
    tableTotal.innerHTML = "Total/" + lect;
    tableHeader.appendChild(tableTotal);

    for (student_info of data) {
        const roll = student_info.student.roll;
        const name = student_info.student.name;
        const div = student_info.student.div;
        const id = student_info.student._id;
        let entry = document.createElement("tr");
        entry.className = "table-row";
        let tableName = document.createElement("td");
        tableName.className = "colm name";
        tableName.innerHTML = toTitleCase(name);
        entry.appendChild(tableName);
        let tableRoll = document.createElement("td");
        tableRoll.className = "colm";
        tableRoll.innerHTML = div + roll;
        entry.appendChild(tableRoll);
        var count = 0;
        for (attn of student_info.attn) {

            const s = attn.present ? "P" : "A";
            if (attn.present) {
                count++;
            }
            let tableAttn = document.createElement("td");
            tableAttn.className = "colm attn";
            // this is attn or abslist id something
            tableAttn.setAttribute('aria-label', attn.id);
            tableAttn.innerHTML = s;
            //this is student id
            tableAttn.id = id;
            // tableAttn.contentEditable = true;
            entry.appendChild(tableAttn);

        }
        let tableAttn = document.createElement("td");
        tableAttn.className = "colm";
        tableAttn.innerHTML = count;
        entry.appendChild(tableAttn);
        tableBody.appendChild(entry);
    }

    table = document.querySelector('.table-wrapper');
    table.classList.remove('hidden');
    document.querySelector('.button-excel').disabled = false;
    document.querySelector('.button-edit').disabled = false;

}

async function req(sid) {
    let kek = [];
    let url = '/subjects' + sid + '/students';

    // let me = await fetch('https://attn-server.herokuapp.com/users/me');
    // let meInfo = await me.json();
    // console.log(meInfo);
    // const name = document.querySelector('#name');
    // const uname = document.createTextNode(meInfo.username);
    // name.appendChild(uname);

    let res = await fetch(url);
    let data = await res.json();
    subject = toTitleCase(data.name);
    let heading = document.querySelector('h1');
    heading.innerHTML = subject;

    let students = data.students
        .sort((a, b) => a.roll - b.roll)
        .sort((a, b) => a.div.localeCompare(b.div))

    for (student of students) {
        let hmm = {
            "attn": [],
            "student": student,
        }
        kek.push(hmm);
    }

    let attn = await fetch('/abs/table' + sid);
    let days = await attn.json();
    // console.log(days);
    for (day of days) {
        let abs = day.absentStudents;
        let date = day.date;
        let id = day._id;

        for (student of kek) {
            let present = true;
            for (absent of abs) {
                if (student.student._id == absent) {
                    student.attn.push({
                        "date": date,
                        "present": false,
                        "id": id
                    })
                    present = false;
                }
            }

            if (present) {
                student.attn.push({
                    "date": date,
                    "present": true,
                    "id": id
                })
            }
        }
    }

    console.log({ kek });
    buildTable(kek);

    if (document.querySelector('.container-fluid').clientWidth < document.querySelector('.attendance-table').clientWidth) {
        let width = document.querySelector('.container-fluid').clientWidth;
        document.querySelector('.table-view').clientWidth = width + 'px';
    } else {
        $(".table-view").css({ 'width': document.querySelector('.attendance-table').clientWidth + 'px' });
    }
}

function convert() {

    //CURRENT DATE CODE START
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1;
    let yyyy = today.getFullYear();

    today = `${dd.toString().padStart(2, '0')}-${mm.toString().padStart(2, '0')}-${yyyy}`;
    //CURRENT DATE CODE END

    let table = document.querySelector(".attendance-table");
    TableToExcel.convert(table, {
        name: `${subject} ${today} Attendance.xlsx`
    });
}

function edit() {
    let edit = document.querySelector('.button-edit');
    edit.hidden = true;
    let save = document.querySelector('.button-save');
    save.hidden = false;
    let attns = document.querySelectorAll('.attn');
    for (attn of attns) {
        attn.addEventListener('click', (e) => {
            let target = e.srcElement;
            if (target.innerHTML == 'P') {
                target.innerHTML = 'A';
            } else {
                target.innerHTML = 'P';
            }
            if (target.getAttribute('class').includes('edited')) {
                list.pop(target.getAttribute('aria-label'));
                target.classList.remove('edited');
            } else {
                list.push(target.getAttribute('aria-label'));
                target.classList.add('edited');
            }
            console.log(list);
        })
    }
}

async function save() {
    //console.log('tes');
    var idList = new Set(list);
    console.log(idList);
    for (id of idList) {
        let studentList = [];
        let column = document.querySelectorAll(`[aria-label="${id}"]`);
    // console.log(column);
        for (row of column) {
            if (row.innerHTML === 'A')
                studentList.push(row.id);
        }
        console.log(studentList);
        data = {
            "absentStudents": studentList
        }
        console.log(JSON.stringify(data));
        let res = await fetch('/abs/' + id, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify(data)
        });
        let resp = await res.json();
        //console.log(resp);
    }
    location.reload();
}

function del() {
    let edit = document.querySelector('.button-edit');
    edit.hidden = true;
    let del = document.querySelector('.button-del');
    del.hidden = true;
    let delsave = document.querySelector('.button-delsave');
    delsave.hidden = false;
    let attns = document.querySelectorAll('.date');
    for (attn of attns) {
        attn.addEventListener('click', (e) => {
            let target = e.srcElement;
            if (target.getAttribute('class').includes('edited')) {
                list.pop(target.getAttribute('aria-label'));
                target.classList.remove('todel');
            } else {
                list.push(target.getAttribute('aria-label'));
                target.classList.add('todel');
            }
            //console.log(list);
        })
    }
}

async function delsave() {
    //console.log('delsave');
    var idList = new Set(list);
    console.log(idList);
    for (id of idList) {
        //let studentList = [];
        // let column = document.querySelectorAll(`[aria-label="${id}"]`);
        console.log(id)
        let res = await fetch('/abs/' + id, {
            method: "DELETE",
        });
        let resp = await res.json();
        location.reload();
        //console.log(resp);
    // console.log(column);
        // for (row of column) {
        //     if (row.innerHTML === 'A')
        //         studentList.push(row.id);
        // }
        // console.log(studentList);
        // data = {
        //     "absentStudents": studentList
        // }
        // console.log(JSON.stringify(data));
        // let res = await fetch('/abs/' + id, {
        //     method: "PUT",
        //     headers: {
        //         'Content-Type': 'application/json'
        //         // 'Content-Type': 'application/x-www-form-urlencoded',
        //     },
        //     body: JSON.stringify(data)
        // });
        // let resp = await res.json();
        // console.log(resp);
    }
}



url = window.location.href;
let subid = /\/[\w]+$/.exec(url);
console.log(subid);
req(subid);


// $(document).ready(function () {
//     $('tbody').scroll(function (e) { //detect a scroll event on the tbody
//         /*
//     Setting the thead left value to the negative valule of tbody.scrollLeft will make it track the movement
//     of the tbody element. Setting an elements left value to that of the tbody.scrollLeft left makes it maintain 			it's relative position at the left of the table.    
//     */
//         $('thead').css("left", -$("tbody").scrollLeft()); //fix the thead relative to the body scrolling
//         $('thead th:nth-child(1)').css("left", $("tbody").scrollLeft()); //fix the first cell of the header
//         $('tbody td:nth-child(1)').css("left", $("tbody").scrollLeft()); //fix the first column of tdbody
//         $('thead th:nth-child(2)').css("left", $("tbody").scrollLeft());
//         $('tbody td:nth-child(2)').css("left", $("tbody").scrollLeft());
//     });
// });