import React from "react";
import PropTypes from "prop-types";
import { State, ExternalURL } from "../../constants/DataLoaderConstants.js";
import DataLoader from "../../actions/DataLoader.js";
import stores from "../../stores/dataStores.js";
import { MDBDataTable, Row, Col, Card, CardBody } from 'mdbreact';
import ApplicationActions from "../../actions/ApplicationActions.js";
import CustomerActions from "../../actions/CustomerActions.js";
import VehicleActions from "../../actions/VehicleActions.js";
/** Cleaned up this class of child-specific code.
 * Please put code that only applies to one of the domains which use CRMView
 * in their own class, or a child class extending CRMView or something.
 * 
 * Input, props containing:
 *  dataType: string, the table name on the CRM, without the "madmv_" prefix. For example, "users" for table madmv_users.
 *  columnSet: array of objects, each containing:
 *      header: string, the text to display in the column header of the displayed table.
 *      key: string, the field name in the CRM. For example: "madmv_applicationtype" or "createdon".
 *  optionSetMappings: array of OptionSetMappings objects. See src/components/views/OptionSetMappings.js for details.
 * 
 * Renders:
 *  An interactive table based on the CRM data, as referred to in the props above.
 * */

export default class CRMView extends React.Component {
    
    render() {
        
        return <div> {this.getContent()} </div>;
    }

    getContent() {
        
        let state = stores[this.props.dataType].data.readState;
        switch (state) {
            case State.DEFAULT:
                return this.getDefaultContent();
            case State.STARTED:
                return this.getStartedContent();
            case State.FAILURE:
                return this.getFailureContent();
            case State.SUCCESS:
                return this.getSuccessContent();
        }
        return this.getStartedContent();
    }

    getDefaultContent() {
        return (
            <div className="alert alert-danger" role="alert">
                Loading did not start.
            </div>
        );
    }

    getStartedContent() {
        return (
            <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    getFailureContent() {
        return (
            <div className="alert alert-danger" role="alert">
                Error while loading!
            </div>
        );
    }

    handleDelete(id){
        console.log(id)
        let deletetype=this.props.dataType
        if(deletetype == 'application')
            ApplicationActions.deleteApplication(id)
        else if(deletetype == 'customer')
            CustomerActions.deleteCustomer(id)
        else if(deletetype == 'vehicle') 
            VehicleActions.deleteVehicle(id)
    }

    handleView(obj){
        console.log(obj)
    }

/*    handleClick(event) {
        // Placeholder, intended to update in some way so as to call a different click event depending on which record is clicked.
        console.log("Placeholder CRMView record clicked event.")
        event.preventDefault();
    }
*/
    getSuccessContent() {
     
        console.log(this.props.headcolumn)
        let content = {
            columns:this.props.headcolumn,  
            /*[
                { label: 'ID',            field: 'madmv_appid' },
                { label: 'Type',          field: 'madmv_applicationtype' },
                { label: 'Subject',       field: 'madmv_applicationsubject' },
                { label: 'Creation Time', field: 'createdon' },
                { label:' ',              field: 'click' },
                { label:' ',              field: 'checkbox' }
            ],*/
            rows: this.getTableBodyContent()
        }
  
       
        
        return (
            <div>
            <Row className="mb-4">
                <Col md="12">
                    <Card>
                        <CardBody>
                            <MDBDataTable
                                striped
                                bordered
                                hover
                                data={content}
                            />
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            <div className="pb-4">
            <Modal comp= {this.props.dataType} />
          </div>
        </div>
        );
    }

    getTableBodyContent() {
        let records = stores[this.props.dataType].data.records;

        records.forEach(record => {
            this.cleanup(record);
            
            //this.addClickEvent(record);
        });
        return records;
    }

    cleanup(record) {
        this.applyOptionSetMappings(record);
        this.cleanupNullFieldValues(record);
        this.addInputs(record);
    }

    applyOptionSetMappings(record) {
        for (const optionSetMap of this.props.optionSetMappings) {
            let mappedField = optionSetMap.getField();
            record[mappedField] = optionSetMap.map(record[mappedField]);
        }
    }

    cleanupNullFieldValues(record) {
        for (const field of Object.keys(record)) {
            if(record[field] === null) record[field] = " ";
        }
    }
    
    addInputs(record) {
       
        record.click =(
            <button
                className="btn btn-sm btn-primary"
                onClick={() => this.handleView(record)}
            >
            Detail Info
            </button>
            );



//base on table type, pass the right id into delete function, also in the delete function, we
//have to check the type to make sure run the right delete action.
        if(this.props.dataType == 'application')
        record.checkbox =(<button
            className="btn btn-sm btn-danger"
            onClick={() => {if (window.confirm('Are you sure you wish to delete this item?')) this.handleDelete(record.madmv_ma_applicationid)}}
            >
            Delete
        </button>
        );
        else if(this.props.dataType == 'customer')
        record.checkbox = (<button
            className="btn btn-sm btn-danger"
            onClick={() => {if (window.confirm('Are you sure you wish to delete this item?')) this.handleDelete(record.madmv_ma_customerid)}}
            >
            Delete
        </button>
        );
        else if(this.props.dataType == 'vehicle')
        record.checkbox = (<button
            className="btn btn-sm btn-danger"
            onClick={() => {if (window.confirm('Are you sure you wish to delete this item?')) this.handleDelete(record.madmv_ma_vehicleid)}}
            >
            Delete
        </button>
        );
        
    }

/*  addClickEvent(record) {
        record.clickEvent =  ()=> this.handleClick ;
    }
*/
    componentDidMount() {
        if (this.needsToLoad()) this.loadFromCRM();
    }

    needsToLoad() {
        return (stores[this.props.dataType].data.readState === State.DEFAULT_STATE);
    }

    loadFromCRM() {
        let dataType = this.props.dataType;
        let query = this.generateQuery();
        new DataLoader(query, dataType).load();
    }

    generateQuery() {
        let columns = this.props.columns;
        let rowKey = "madmv_ma_" + this.props.dataType + "id";

        let query = ExternalURL.DYNAMICS_PREFIX + this.props.dataType + ExternalURL.DYNAMICS_SUFFIX + rowKey;
        for (let i = 0; i < columns.length; i++) {
            let key = columns[i].field;
            query += "," + key;
        }
        return query;
    }
}

CRMView.propTypes = {
    dataType: PropTypes.string.isRequired,
    columns: PropTypes.array.isRequired,
    optionSetMappings: PropTypes.array.isRequired,
    headcolumn: PropTypes.array.isRequired,
};
