 (function(){
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
       .register('./service-worker.js')
       .then(function() { 
          console.log('Service Worker Registered !!!'); 
        });
    }   
  })()



  function ConverFormToJson(form){
    var array = jQuery(form).serializeArray()
    var json = {}
    jQuery.each(array, function(){
        json[this.name] = this.value || '';
    });
    return json;
}

 // Document loaded 
  $(document).ready(function(){

    console.log('content loaded !!!')
    pushedSavedTickets()

    var elems = document.querySelectorAll('.fixed-action-btn');
    var instances = M.FloatingActionButton.init(elems, {
        direction: 'left',
        hoverEnabled: false
    });

    $('.sidenav').sidenav();
    $('.fixed-action-btn').floatingActionButton();

    //loading tickets when menu is clicked
    $('#page_menu').click(function(){
      console.log('load tickets from DB !!!')
    })
    // call for subjects
    GetTicketSubjects()
    // indexDB 
    //prefixes of implementation that we want to test
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
             
    //prefixes of window.IDB objects
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
    
    var db;

    if (!('indexedDB' in window)) {
      console.log('This browser does not support IndexedDB');
      M.toast({html: 'This browser does not support offline storage'})      
    }    
    
      console.log('Creating or Open New Database !!!')
      window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      var request = window.indexedDB.open('TestDB',1);

      // on error 
      request.onerror = function(e){  
        console.log(' Error : global !!! ')    
      }
      // on success
      request.onsuccess = function(e){
        db = request.result
        //console.log("success: "+ db);
      }
      // on upgrade
      request.onupgradeneeded = function(event) {
        var db = event.target.result;
        var objectStore = db.createObjectStore("TicketStore", {keyPath: "id"});        
     }


     function addToDB(error_object) { // start of addToDB

      var request = window.indexedDB.open("TestDB");
      request.onerror = function(event) {
       console.log(" on createDatabase !!! ");
       };
     
       request.onsuccess = function(event) {
         db = request.result;
         var count = 0;

      var objectStore = db.transaction("TicketStore").objectStore("TicketStore");
      objectStore.openCursor().onsuccess = function(event) { // start of object store
        var cursor = event.target.result;
           
        if (cursor) { // check if cursor is full
          count = cursor.key
          cursor.continue();
        } else {
          if(count == 5){
            console.log('indexdb reached limited !!!')
          }else{ // start of else
               count ++
               console.log('count: '+count)
               var request = db.transaction(["TicketStore"], "readwrite")
               .objectStore("TicketStore")
               .add({id: count, payload:JSON.stringify(error_object),created: new Date().getDate()});
               request.onsuccess = function(event) {
                 console.log('Record added !!!')
             };
             
             request.onerror = function(event) {
                 console.log('Error adding record ')
             }
             request.oncomplete = function(){
               request.close()
               console.log('database closed !!!')
             }          
          } // end of else 
        }
       } // end of object store 

      }// end of request.onsuccess

    } // end of addToBD
      
    $('form').submit(function(e){ // start of form submit
      e.preventDefault();

      var form = this;
      var json = ConverFormToJson(form);
      //console.log(json)    
      var formPromise = new Promise(
        function(resolve, reject){
          if(!jQuery.isEmptyObject(json) ){
            
            var url = "http://localhost:5000/api"
            json['name'] = json['subject']
            json['action'] = 'ticket_registration'
            json['username'] = 'anonymous'
            json['assignee'] = 'admin'
            json['description'] = "hello world description"
            console.log(json)
            $.ajax({
                type: "POST",
                url: url,
                data: json, // serializes the form's elements.
                success: function (data) { 
                    console.log('Response: '+ data)
                    resolve(data)
                    $('#ticket_form')[0].reset();
                },
                error: function(jqXHR){
                  json['response'] = jqXHR
                  reject(json)
                  $('#ticket_form')[0].reset();
                }
            });
            
          }else{
            var response = new Error('Form is empty !!!')
            reject(response)
          }        
        })
   
  
        /** calling promise  */
        var saveTicket = function(){
          formPromise.then(function(fulfilled){
            console.log(fulfilled)
          }).catch(function(error){
            console.log('error sending tickets !!!')
            addToDB(error)
          })
        }
  
        saveTicket()
    }) // end of form submit
  

    }); // end of document ready 

    /** subject category  **/

    $("#ticket_subjects").change(function(){
      $.getJSON("http://localhost:5000/categories/" + $("#ticket_subjects").val(), function(data, status){
          var data_obj = JSON.stringify(data)
          optionHTML = '<option value = "Null"> Select Option </option>';
          if(data==undefined||data.length==0){
            console.log("null")
            M.toast({html:'No Categories available !!!'})
          }else{
            //console.log(data)
            for (var i in data){
              optionHTML += '<option value = "' + data[i].name + '">' + data[i].name + '</option>';
              //$("#category").append('<option value = "' + data[i].name + '">' + data[i].name + '</option>')
            }
          }
          $("#ticket_category").html(optionHTML);
      })
    });


    // ticket category changed 

    $('#ticket_category').change(function(){
      $.getJSON("http://localhost:5000/subcategories/" + $("#ticket_category").val(), function(data, status){
        var optionHTML = '<option value = "Null"> Select Option </option>';
        var data_obj = JSON.stringify(data)
        //console.log(data_obj) // for debugging
        //console.log("****")
        //console.log(data)
        if (data == undefined || data.length == 0){
            M.toast({html:'No Subcategories available'})
            console.log('null')

        }else {
            //console.log(data)
            for(var i in data){
              optionHTML += '<option value = "' + data[i].name + '">' + data[i].name + '</option>';
          }

        }
        $("#ticket_subcategory").html(optionHTML)
        });
      });

/** API calls  */
function GetTicketSubjects(){
      /** start */
      $.ajax({
        type:"GET",
        dataType: "json",
        contentType: 'application/json; charset=utf-8',
        url: "http://localhost:5000/subjects",
        success: function(data){
        //console.log(data);
        for (var i in data){
            $("#ticket_subjects").append('<option value = "' + data[i].name + '">' + data[i].name + '</option>')
        }
        },
        error: function(jqXHR) {
          console.log(jqXHR);
          var toastHTML = '<span> Ticket Subjects failed to Load !!! </span>';
          M.toast({html:toastHTML})
        }    
        });
      /**  end **/  
}
/** working with indexDB */

function openDatabase(error_obj){
    var count = 0;
    var objectStore = db.transaction("TicketStore").objectStore("TicketStore");
    objectStore.openCursor().onsuccess = function(event) { // start of object store
      var cursor = event.target.result;
      //console.log(cursor)     
      if (cursor) { // check if cursor is full
        count = cursor.key
        cursor.continue();
      } else {
        //console.log(count)
        if(count == 5){
          console.log('indexdb reached limited !!!')
        }else{ // start of else
             count ++
             console.log('count: '+count)
             var request = db.transaction(["ticketStore"], "readwrite")
             .objectStore("ticketStore")
             .add({id: count, payload:JSON.stringify(error_obj),created: new Date().getDate()});
             request.onsuccess = function(event) {
               console.log('Record added !!!')
           };
           
           request.onerror = function(event) {
               console.log('Error adding record ')
           }
           request.oncomplete = function(){
             request.close()
             console.log('database closed !!!')
           }          
        } // end of else 
      }
     } // end of object store 
    }





/* -- called first */
/*
function readDB(){
  listHmtl = '';
  var db 
  var openRequest = indexedDB.open('TicketStore')
  openRequest.onsuccess = function(e){
    db = openRequest.result
    console.log(db)
  }
  openRequest.onerror = function(){
    console.log('error')
  }
  openRequest.transaction(["TicketStore"]).object("TicketStore").openCursor().onsuccess = function(e){
    var cursor = e.target.result;
    if(cursor){
      console.log(cursor.key)
      listHmtl += '<li>  Key ' + cursor.key + '<li>'
    }
  }
  $('#ticket_list').html(listHmtl)
}

*/

function pushedSavedTickets(){
  
  var object = [];
  var request = window.indexedDB.open('TestDB',1);


  request.onsuccess = function(event) {
    db = request.result;
  var objectStore = db.transaction("TicketStore").objectStore("TicketStore");
  objectStore.openCursor().onsuccess = function(event) { // start of object store
    var cursor = event.target.result;  
    if (cursor) { // check if cursor is full
      object.push(cursor.value.payload)
      displayTickets(cursor.value.payload)
      cursor.continue();
    } else {
               
      } // end of else 
    } // end of objectStore

    objectStore.oncomplete = function(e){
      callback(object)
    }
  }// end of request.onsuccess

  request.onupgradeneeded = function(event) {
    var db = event.target.result;
    var objectStore = db.createObjectStore("TicketStore", {keyPath: "id"});        
  }// end of request.onupgradeneeded

  request.onerror = function(e){  
    console.log(' Error : global !!! ')    
  }// end of request.onerror
   
  }

  function displayTickets(obj){
    listHtml = '';
    var a = []
    //var b = JSON.parse(a)
    //console.log(obj['subject'])
    a.push(obj)
    //console.log(a[0])
    //console.log(a[0].subject)
    var b = JSON.parse(a[0])
    //console.log(b.subject)
    //console.log(b.response.statusText)

    $('#ticket_list').append('<li class="collection-header"><h7>'+ b.response.statusText +'</h7></li>')

  }
      