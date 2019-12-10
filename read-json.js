const fs = require('fs');
const excel = require('excel4node');

const arg = process.argv.slice(2);
if(!arg.length || !arg[0] ){
    console.log('Wrong parameter, usage => node read-json file.json')
    return;
}

const sourceFile = arg.pop();
const obj = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

const delimiters = ['p', 's'];

const {
    runs
} = obj;

const filesExecuted = [...new Set(runs.map(el => el.instance_path))]
let outputFinal = [];

filesExecuted.forEach(file => {
    const filteredByFilePath = runs.filter(el => el.instance_path == file);
    let output = {}
    delimiters.forEach(key => {
        const arrFilteredByDelimiter = filteredByFilePath
            .filter(el => el.params.param_id == key)
            .map(el => el.kpis);
        const countReports = arrFilteredByDelimiter.length;
        const reducedOutput = {
            data: arrFilteredByDelimiter,
            count: countReports
        }
        output[`${key}`] = reducedOutput;
    });

    let reportFinal = {}
    for (const key in output) {
        if (output.hasOwnProperty(key)) {
            const element = output[key];
            const resultFor = element.data.map(el => el.time).reduce((acc, curr) => acc += curr) / element.count;
            reportFinal[`${key}`] = resultFor;
        }
    }
    const f = file.split('/')
    outputFinal.push({
        file: f[(f.length -1)],
        ...reportFinal
    });
})
// Create a new instance of a Workbook class
const workbook = new excel.Workbook();

// Add Worksheets to the workbook
const worksheet = workbook.addWorksheet('Sheet 1');

worksheet.cell(2, 1).string('arquivo')
worksheet.cell(2, 2).string('single thread')
worksheet.cell(2, 3).string('multi thread')


outputFinal.forEach((res, idx) => {
    const more = idx + 3;
    worksheet.cell(more, 1).string(res.file)
    worksheet.cell(more, 2).number(res.s)
    worksheet.cell(more, 3).number(res.p)
})

workbook.write('output.xlsx');
console.log('file writed!')