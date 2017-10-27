function toggleSignIn(event) {
  event.preventDefault();
  if (!firebase.auth().currentUser) {
    
    var provider = new firebase.auth.GoogleAuthProvider();
    
    firebase.auth().signInWithPopup(provider).catch(function(error) {
      
      var errorCode = error.code;
      var errorMessage = error.message;
      
      var email = error.email;
      
      var credential = error.credential;
      
      if (errorCode === 'auth/account-exists-with-different-credential') {
        alert('You have already signed up with a different auth provider for that email.');
        
      } else {
        console.error(error);
      }
     
    });
    
  } else {
   
    firebase.auth().signOut();
    
  }
}


function addToTable(key, train) {
  var row = $("<tr>").attr("id", key).attr("data-start", train.first);
  var name = $("<th>").attr("scope", "row").text(train.name).attr("data-name", train.name);
  var dest = $("<td>").text(train.destination).attr("data-dest", train.destination);
  var freq = $("<td>").text(train.frequency).attr("data-fq", train.frequency);
  var arrival = $("<td>");
  var until = $("<td>");
  var btns = $("<td>").addClass("btn-group").attr("role", "group");
 
  var next = arrivalTime(train.frequency, train.first);

  arrival.text(next.format("h:mm A")).attr("data-next", next);
  until.text(next.fromNow());
  
  row.append(name).append(dest).append(freq).append(arrival).append(until);
  $("#timeTrains").append(row);
}



function arrivalTime(freq, first, format = "HH:mm") {
  var arrive = moment(first, format);
  if (arrive.isBefore(moment())) {
    var diff = moment().diff(moment(arrive), "minutes");
    var till = freq - (diff % freq);
    arrive = moment().add(till, "minutes");
  }
  return arrive;
}

function newTrain(snapshot) {
  console.log(snapshot.val());
  addToTable(snapshot.key, snapshot.val());
}

function changeTrain(snapshot) {
  console.log(snapshot.val());
  var elements = $("#" + snapshot.key).children();
  $(elements[0]).text(snapshot.val().name).attr("data-name", snapshot.val().name);
  $(elements[1]).text(snapshot.val().destination).attr("data-dest", snapshot.val().destination);
  $(elements[2]).text(snapshot.val().frequency).attr("data-fq", snapshot.val().frequency);
  var arrival = elements[3];
  var until = elements[4];
  var next = arrivalTime(snapshot.val().frequency, snapshot.val().first)

  $(elements[3]).text(next.format("h:mm A")).attr("data-next", next);
  $(elements[4]).text(next.fromNow());

}
  //Firebase

$(document).ready(function initialize() {
  
   var config = {
    apiKey: "AIzaSyB2eYbmkBjLNajOWBLmK001MPbTQ5TLIH8",
    authDomain: "train-15615.firebaseapp.com",
    databaseURL: "https://train-15615.firebaseio.com",
    projectId: "train-15615",
    storageBucket: "",
    messagingSenderId: "645045285962"
  };
  firebase.initializeApp(config);

  var database = firebase.database();
  var trainRef = database.ref("/trains");

  // Listening for auth state changes.
  // [START authstatelistener]
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      var providerData = user.providerData;
      // [START_EXCLUDE]
      $("#signInText").text('Sign out');
      trainRef = database.ref("/trains" + uid);
      $("#timeTrains").empty();
      trainRef.off("child_added");
      trainRef.off("child_changed");
      trainRef.on("child_added", newTrain, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
      });

      trainRef.on("child_changed", changeTrain, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
      });
      
    } else {
      
      $("#signInText").text('Sign In');
      trainRef = database.ref("/trains");
      switchTrains();
     
    }
    
  });
  

  function switchTrains(){
      $("#timeTrains").empty();
      trainRef.off("child_added");
      trainRef.off("child_changed");
      trainRef.on("child_added", newTrain, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
      });

      trainRef.on("child_changed", changeTrain, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
      });
  }

  $("#signIn").on("click", toggleSignIn);


 

  $("#addTrain").on("submit", function getNewTrain(event) {
    event.preventDefault();
    trainRef.push({
      name: event.target.trainName.value.trim(),
      destination: event.target.trainDest.value.trim(),
      first: event.target.trainTime.value,
      frequency: parseInt(event.target.trainFreq.value)
    });
    event.target.reset();
  });

  $("#updateTrain").on("submit", function updateTrain(event) {
    event.preventDefault();
    var key = event.target.dataset.key;
    trainRef.child(event.target.dataset.key).update({
      name: event.target.trainName.value.trim(),
      destination: event.target.trainDest.value.trim(),
      first: event.target.trainTime.value,
      frequency: parseInt(event.target.trainFreq.value)
    });
    $("#updateModal").modal("hide");
  });

  $(document).on("click", ".remove", function removeRow(event) {
    event.preventDefault();
    var result = confirm("Are you sure you want to delete this train?");
    if (result) {
      trainRef.child(this.dataset.key).remove();
      $(this).parent().parent().remove();
    }
  });

  $(document).on("click", ".update", function updateRow(event) {
    event.preventDefault();
    trainRef.child(this.dataset.key).once("value").then(function(snapshot) {
      var data = snapshot.val();
      var form = $("#updateTrain")[0];
      form.trainName.value = data.name;
      form.trainDest.value = data.destination;
      form.trainTime.value = data.first;
      form.trainFreq.value = data.frequency;
      $("#updateTrain").attr("data-key", snapshot.key);
      $("#updateModal").modal("show");
    });
  });

  var update = setInterval(updateTimes, 60000);

});