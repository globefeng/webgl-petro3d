import React, { useContext } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField } from '@material-ui/core';
import { PetroContext } from '../../context/petroContext';
import { projectService } from '../../services/projectService';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const AddLasDialog = (props) => {
    const { Token } = useContext(PetroContext)

    return (
        <Dialog maxWidth="md" fullWidth={true} open={props.open} aris-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Add Las</DialogTitle>
            <DialogContent>

            <Formik
                    initialValues={ {
                        lasData: '',
                        }
                    }
                    validationSchema={Yup.object().shape({
                        lasData: Yup.string().required('Las data is required'),
                    })}
                    onSubmit={({ lasData }, { setStatus, setSubmitting }) => {
                        setStatus();
                        let formData = new FormData();
                        formData.append("Data", lasData);
                        projectService.addLas(props.projectId, props.item.id, formData, Token).then(res => {
                            window.location.reload(true);
                        },
                        error => alert('Fail to add perforation')); 
                    }}
                    render={({ errors, status, touched, isSubmitting }) => (
                        <Form>                                                                              
                            <div style={{display:'flex', justifyContent: 'space-between', marginBottom:'20px', width:'100%'}}>
                                <Field name="lasData"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '100%'}}>
                                            <TextField type="text" multiline rows="18" variant="outlined" label="Las data" fullWidth InputLabelProps={{shrink: true}}  {...field} /> 
                                            <div><ErrorMessage name="lasData" component="div" style={{color:'red'}} /></div>
                                        </div>
                                   )}
                                </Field> 
                            </div>                            

                            <div style={{display:'flex', justifyContent: 'flex-end'}}>
                                <Button type="submit" style={{marginRight: '40px', textTransform:'none'}} size="medium" variant="contained" color="primary" >Add Las</Button>
                                <Button style={{marginRight: '10px', textTransform:'none'}}  size="medium" variant="contained" onClick={() => props.handleDialogClose()} >Cancel</Button>
                            </div>

                        </Form>
                    )}
                /> 

            </DialogContent>
        </Dialog>
    )
}

export default AddLasDialog;
