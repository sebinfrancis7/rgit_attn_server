function showStudents() {
    let filt = document.getElementById('sub_div').value;
    let N_sub = document.getElementById('subject1').value;
    let teach_id = 'test';

    fetch('/users/me').then((res) => {
        res.json().then((data) => {
            console.log(data._id);
            teach_id = data._id;
        });
    });

    fetch(`/students${filt}`).then((res) => {
        res.json().then((data) => {
            console.log(data);
            if (data.length > 0) {
                data.sort(function (a, b) {
                    if (a.div == b.div) {
                        return a.roll - b.roll;
                    }
                });

                var temp = '<tr><th>Roll number</th>';
                temp += '<th>Name</th>';

                data.forEach((u) => {
                    temp += '<tr>';

                    temp +=
                        '<td>' +
                        `<input type="checkbox"  name="value" id="c2" value="${u._id}"  checked ><label for="nroll">` +
                        ' ' +
                        u.div +
                        u.roll +
                        '</label></td>';
                    temp += '<td>' + u.name + '</td>';
                });

                document.getElementById('data').innerHTML = temp;
            }
        });
    });

    $(document).ready(function () {
        $('#save-class').click(async function () {
            var sclass = [];
            $.each($("input[name='value']:checked"), function () {
                sclass.push($(this).val());
            });
            alert('Members added are: ' + sclass.join(', '));

            console.log(sclass);
            var obj = {
                name: N_sub,
                teacher: teach_id,
                students: sclass,
            };

            let res = await fetch('/subjects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(obj),
            });
            let resp = await res.json();
            console.log(resp);
        });
    });
}

async function postClass(data) {
    let res = await fetch('/subjects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    let resp = await res.json();
}
