angular.module('app').controller('HomeCtrl', function() {
  var self = this;
  self.greeting = 'World';

  self.model = {
    text: ''
  };

  self.buttonClicked = function() {
    if (self.model.text === '') {
      alert('Please enter text in the input field');
    } else {
      alert('Heya, ' + self.model.text);
    }
  };
});
