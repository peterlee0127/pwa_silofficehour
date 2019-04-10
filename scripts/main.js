
var calender = new Vue({
  el: '#calenderList',
  data() {
    return {
      calenders: []
    }
  }
  ,
  created: function initCalender() {
    var calenders = [];
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://aucal.pdis.nat.gov.tw/auCal');
    xhr.send();
    xhr.onload = function () {
      if (xhr.status === 200) {
        var res = JSON.parse(xhr.responseText)

        var dayList = getWednesday(4,new Date().getDate());
        var pointer = 0;

        var resBook;
        var xhrBook = new XMLHttpRequest();
        xhrBook.open('GET', 'https://aucal.pdis.nat.gov.tw/getReserve');
        xhrBook.send();
        xhrBook.onload = function () {
            if (xhrBook.status === 200) {
                resBook = JSON.parse(xhrBook.responseText)

                var booked = {};

                resBook.reservations.forEach(function(element) {
                    var tmpKey = element.startDate.substring(0, element.startDate.indexOf('T'))

                    //後臺預約起訖跨多個時段時 前臺顯示並計算出跨幾個已預約時段
                    let times = moment.utc(element.bufferedEndDate).local().valueOf()/1000-moment.utc(element.bufferedStartDate).local().valueOf()/1000;
                    let numOfSlot = Math.ceil(times/(60*60)); // 60min per slot

                    if (booked[tmpKey] == null) {
                        booked[tmpKey] = numOfSlot;
                    }
                    else {
                        booked[tmpKey] = booked[tmpKey] + numOfSlot;
                    }
                });

                // const MaxBooking = 3;//每日可預約總數
                const availableTimespans = ["T14:00", "T15:00", "T16:00"];
                var MaxBooking = availableTimespans.length; //每日可預約總數
                const MaxAvailableMonth = 2; //開放可預約月數 本月+N月

                calenders.forEach(function(element) {

                    if (booked[element.fullDT] == MaxBooking) {
                        element.bookStatus = "已額滿"
                        element.clsBookStatus="red"
                    }
                    else if (booked[element.fullDT] < MaxBooking) {
                        element.bookStatus = "尚可預約"
                        element.clsBookStatus="blue"
                    }
                    else if (new Date(element.fullDT).getMonth() <= (new Date().getMonth() + MaxAvailableMonth) && new Date(element.fullDT) > new Date()) {

                        element.bookStatus = "尚可預約"
                        element.clsBookStatus="blue"
                    }
                    else {
                        element.bookStatus = "未開放預約"
                        element.clsBookStatus="red"
                    }

                });

            }
            else {
                //err
            }
        };

        //align data
        while (moment.utc(res.items[pointer].start).local() < new Date()) {
            pointer++;
        }
        if (new Date().getDay() !== 3) {
            pointer++;
        }

        dayList.forEach(function (element) {

          if (calenders.length >= 12) {
            return;
          }

          var date = ("0" + (element.getMonth() + 1)).slice(-2) + "-" + ("0" + element.getDate()).slice(-2); //MM/dd
          var auDate = moment.utc(res.items[pointer].start).local().format("MM-DD");
          console.log(date + "  " + auDate);
          if (auDate === (date)) {
            //勞動節要上工
            if (res.items[pointer].holiday == true && moment.utc(res.items[pointer].start).local().format("MM-DD") != "05-01") {//排除假日
              console.log(date + "holiday")
            }
            else {
              var startHHmm = moment.utc(res.items[pointer].start).local().hours() < 10 ? "10:00" : moment.utc(res.items[pointer].start).local().format("HH:mm");
              var clsSubtitle = 'calenderSubtitle blue';
              if (startHHmm != "10:00") {
                clsSubtitle = 'calenderSubtitle red';
              }
              var datetime = startHHmm + "～" + moment.utc(res.items[pointer].end).local().format("HH:mm");                                        
              var objCalender = { fullDT: element.getFullYear() + "-" + date, title: date + "(三)", date: date + "(三)", subtitle: datetime, cls: "calenderGreen", clsSubtitle: clsSubtitle, bookStatus: "" ,clsBookStatus:""}
              calenders.push(objCalender);
            }
            pointer++;
          }
          else {
            var objCalender = { fullDT: element.getFullYear() + "-" + date, title: date + "(三)", date: date + "(三)", subtitle: "另有公務行程", cls: "calenderRed", clsSubtitle: "calenderSubtitle red", bookStatus: "",clsBookStatus:"" }
            calenders.push(objCalender);
          }
        });


        var updateDT = new Date(new Date(res.updateTime).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
        new Vue({
          el: '#updateDT',
          data() {
            return {
              updateDT: "最後更新時間：" + updateDT.getFullYear() + "-" + (updateDT.getMonth() + 1) + "-" + updateDT.getDate() + " " + updateDT.getHours() + ":00 GMT+8"
            }
          }
        })

      }
      else {
        //err
      }
    };

    this.calenders = calenders;
  }
})


//auto reload
function myrefresh() {

  try {
    var xhrTest = new XMLHttpRequest();
    xhrTest.open('GET', 'https://aucal.pdis.nat.gov.tw/auCal');
    xhrTest.send();
    xhrTest.onload = function () {
      if (xhrTest.status === 200) {
        window.location.reload();

      }
    }

  }
  catch (err) {
    console.log("refresh err")
  }
}
var interval_time = 1000 * 60 * 60 * 1; //every 1 Hr

setInterval(function () {
  myrefresh();
  console.log("re render");
}, interval_time);


function getWednesday(monthCount,setfirstDate) {
  var d = new Date(),
    month = d.getMonth(),
    Wednesdays = [];

  d.setDate(setfirstDate);
  // Get the first Wednesday in the month
  while (d.getDay() !== 3) {
    d.setDate(d.getDate() + 1);
  }
  var tmpd = new Date();
  tmpd.setMonth(tmpd.getMonth() + monthCount);
  var endmonth = tmpd.getMonth();

  // Get all the other Wednesday in the month
  while (d.getMonth() !== endmonth) {
    Wednesdays.push(new Date(d.getTime()));
    d.setDate(d.getDate() + 7);
  }
  return Wednesdays;
}



