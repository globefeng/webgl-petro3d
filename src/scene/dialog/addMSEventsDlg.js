import React, { useState, useContext } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField } from '@material-ui/core';
import { PetroContext } from '../../context/petroContext';
import { projectService } from '../../services/projectService';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const AddMSEventsDialog = (props) => {
    const { Token } = useContext(PetroContext)
    const [unitType, setUnitType] = useState('METER');

    return (
        <Dialog maxWidth="md" fullWidth={true} open={props.open} aris-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Add MicroSeismic Events</DialogTitle>
            <DialogContent>
            <Formik
                    initialValues={ {
                        wellboreName: '',
                        eventData: '',
                        }
                    }
                    validationSchema={Yup.object().shape({
                        wellboreName: Yup.string().required('Treatment wellbore name is required'),
                        eventData: Yup.string().required('Event data is required'),
                    })}
                    onSubmit={({ wellboreName, eventData }, { setStatus, setSubmitting }) => {
                        setStatus();
                        let formData = new FormData();
                        formData.append("wellboreName", wellboreName);
                        formData.append("eventData", eventData);
                        formData.append("UnitType", unitType);
                        projectService.addEvents(props.projectId, formData, Token).then(res => {
                            window.location.reload(true);
                        },
                        error => alert('Fail to add perforation')); 
                    }}
                    render={({ errors, status, touched, isSubmitting }) => (
                        <Form>    
                            <div style={{display:'flex', justifyContent: 'space-between', alignItems:'flex-end'}}>
                                <Field name="wellboreName"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '48%'}}>
                                            <TextField type="text" variant="outlined" label="Treatment Wellbore Name" fullWidth InputLabelProps={{shrink: true}}  {...field} /> 
                                            
                                        </div>
                                   )}
                                </Field>  
                                <Field name="unitType"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '48%'}}>
                                            <fieldset style={{border:'#cccccc 1px solid', borderRadius:'5px', padding:'13px'}}>
                                            <legend>Unit</legend>
                                                <label style={{marginRight:'10px'}}>
                                                    <input type="radio" name="UnitType" value="METER" checked={unitType === "METER"} onChange={() => setUnitType('METER')} />
                                                    Meter
                                                </label>
                                                <label>
                                                    <input type="radio" name="UnitType" value="FOOT" checked={unitType === "FOOT"} onChange={() => setUnitType('FOOT')} />
                                                    Foot
                                                </label>
                                            </fieldset>
                                        </div>
                                   )}
                                </Field>                                                                                      
                            </div> 
                            <div><ErrorMessage name="wellboreName" component="div" style={{color:'red'}} /></div>
                            <div style={{display:'flex', justifyContent: 'space-between', marginBottom:'20px', width:'100%', marginTop:'20px'}}>
                                <Field name="eventData"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '100%'}}>
                                            <TextField type="text" multiline rows="18" variant="outlined" label="Stage, Longitude, Latitude, Elevation, Date, Time, AMP, SNR, MAG, CON" fullWidth InputLabelProps={{shrink: true}}  {...field} /> 
                                            <div><ErrorMessage name="eventData" component="div" style={{color:'red'}} /></div>
                                        </div>
                                   )}
                                </Field> 
                            </div>                            

                            <div style={{display:'flex', justifyContent: 'flex-end'}}>
                                <Button type="submit" style={{marginRight: '40px', textTransform:'none'}} size="medium" variant="contained" color="primary" >Add Events</Button>
                                <Button style={{marginRight: '10px', textTransform:'none'}}  size="medium" variant="contained" onClick={() => props.handleDialogClose()} >Cancel</Button>
                            </div>

                        </Form>
                    )}
                /> 

            </DialogContent>
        </Dialog>
    )
}

export default AddMSEventsDialog;
