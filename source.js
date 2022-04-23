const fs = require('fs');
const code = `${fs.readFileSync('./index.lang')}`;
var input = require('readline-sync').question;

function evalRegex(regex, str) {
  let m;
  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    return m
  }
}

function wrap(a, b, msg) {
  return '\u001b['+ a + 'm' + msg + '\u001b[' + b + 'm'
}

let variables = {
  
};

let toPrint = []

function print(str, stdout = false) {
  if (process.exitImmediately) return
  
  if (stdout) process.stdout.write(str)
  else console.log(str)
}

const keywords = {
  'SET': (args, index) => {
    const varname = args.shift();
    args.shift();
    let value = ""
    let match = evalRegex(/("|')(.+)("|')/g, args.join(' ')) || []
    if (match.length) {
      value = match[2] // String!
    }
    else if (args[0] in variables) {
      value = variables[args[0]].split('\\n').join('\n')
    }
    else {
      console.error(wrap(31, 39, `Error on line ${index + 1}: ${args[0]} is not defined.`))
      process.exitImmediately = 1
    }
    variables[varname] = value;
  },
  'CONSOLE': (args, index) => {
    let match = evalRegex(/("|')(.+)("|')/g, args.join(' ')) || []
    if (match.length) {
      print(match[2].split('\\n').join('\n')) // String!
    }
    else if (args[0] in variables) {
      print(variables[args[0]].split('\\n').join('\n'))
    }
    else {
      console.error(wrap(31, 39, `Error on line ${index + 1}: ${args[0]} is not defined.`))
      process.exitImmediately = 1
    }
  },
  'STDOUT': (args, index) => {
    let match = evalRegex(/("|')(.+)("|')/g, args.join(' ')) || []
    if (match.length) {
      print(match[2].split('\\n').join('\n'), true) // String!
    }
    else if (args[0] in variables) {
      print(variables[args[0]].split('\\n').join('\n'), true)
    }
    else {
      console.error(wrap(31, 39, `Error on line ${index + 1}: ${args[0]} is not defined.`))
      process.exitImmediately = 1
    }    
  },
  'ERROR': (args, index) => {
    let match = evalRegex(/("|')(.+)("|')/g, args.join(' ')) || []
    if (match.length) {
      print(wrap(31, 39, match[2].split('\\n').join('\n'))) // String!
    }
    else if (args[0] in variables) {
      print(wrap(31, 39, variables[args[0]].split('\\n').join('\n')))
    }
    else {
      console.error(wrap(31, 39, `Error on line ${index + 1}: ${args[0]} is not defined.`))
      process.exitImmediately = 1
    }
  },
  'ERRORANDKILL': (args, index) => {
    keywords['ERROR'](args, index)
    process.stopExecution = true
  },
  'INPUT': (args, index) => {
    const varname = args.shift();
    args.shift();
    let question = "";
    let match = evalRegex(/("|')(.+)("|')/g, args.join(' ')) || []
    if (match.length) question = match[2].split('\\n').join('\n');
    else if (args[0] in variables) question = variables[args[0]].split('\\n').join('\n')
    else {
      console.error(wrap(31, 39, `Error on line ${index + 1}: ${args[0]} is not defined.`))
      process.exitImmediately = 1
    }
    if (!process.exitImmediately) variables[varname] = input(question + " ");
  }
}


code.split('\n').forEach((line, index) => {
  if (!process.stopExecution) {
    const args = line.split(' ');
    if (!args.join('').length) return;
    const keyword = args.shift();
    if (keyword in keywords) {
      keywords[keyword](args, index)
    } else if (line.startsWith("@")) { // comment, also checks the line so comments with no space work
      return;
    } else {
      console.error(wrap(31, 39, `Error on line ${index + 1}: ${keyword} is not a valid keyword.`))
      process.exitImmediately = 1
    }
  }
});