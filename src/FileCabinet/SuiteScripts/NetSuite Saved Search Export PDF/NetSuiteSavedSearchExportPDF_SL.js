/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
        'N/ui/serverWidget',
        './NetSuiteSavedSearchExportPDF_SL_Config',
        'N/search',
        'N/file',
        'N/render',
        'N/xml'
    ],

    (
        ui,
        CONFIG,
        search,
        file,
        render,
        xml
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            if(scriptContext.request.method === 'GET') {
                const form = ui.createForm({
                    title: CONFIG.APP.NAME,
                    hideNavBar: false
                });

                form.addField({
                    id: CONFIG.SUITELET.FIELDS.SAVED_SEARCH.ID,
                    type: ui.FieldType.INTEGER,
                    label: CONFIG.SUITELET.FIELDS.SAVED_SEARCH.LABEL
                });

                form.addSubmitButton(CONFIG.SUITELET.BUTTONS.GENERATE.LABEL);

                scriptContext.response.writePage(form);
            }

            if(scriptContext.request.method === 'POST') {
                const savedSearchId =
                    scriptContext.request.parameters[CONFIG.SUITELET.FIELDS.SAVED_SEARCH.ID];

                const savedSearchResults = getSavedSearchResults(savedSearchId);
                const file = createPdfFile(savedSearchResults, `Saved Search ${savedSearchId} Export.PDF`);

                scriptContext.response.writeFile(file);
            }

        }

        const createPdfFile = (savedSearchResults, fileName) => {
            let renderer = render.create();
            renderer.templateContent = file.load(CONFIG.APP.TEMPLATE_FILE_PATH).getContents();

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: savedSearchResults
            });

            const pdfFile = renderer.renderAsPdf();
            pdfFile.name = fileName;

            return pdfFile;
        }

        const getSavedSearchResults = (searchId) => {
            const savedSearch = search.load({
                id: searchId
            });
            const columns = savedSearch.columns;

            const results = {
                columns: columns.reduce(function (accumulator, column) {
                    accumulator.push(column.label);
                    return accumulator;
                },[]),
                rows: [],
                savedSearchId: searchId
            };

            const pagedData = savedSearch.runPaged();
            pagedData.pageRanges.forEach(function(pageRange){
                const page = pagedData.fetch({index: pageRange.index});
                page.data.forEach(function(result){
                    const row = {};
                    columns.forEach(function (column, index) {
                        row['_'+index] = result.getText(column) ?
                            escapeXML(result.getText(column)) : escapeXML(result.getValue(column));
                    });
                    results.rows.push(row);
                });
            });

            return results;
        }

        const escapeXML = (xmlText) => {
            xmlText = '' + removeHtmlTags(xmlText);
            return xml.escape({
                xmlText: xmlText
            });
        };

        const removeHtmlTags = (value) => {
            if(value) {
                return value
                    .replace(/<[^>]*>?/gm, "").replace('&nbsp;','')
            } else return value;
        }

        return {onRequest}

    });
