@app.post("/api/documents/upload-complete")
async def upload_complete_webhook(
    webhook_data: WebhookUploadComplete,
    user: dict = Depends(verify_token)
):
    """NEW ENDPOINT: Webhook called after frontend successfully uploads file"""
    try:
        job_id = webhook_data.job_id
        logger.info(f"[v0] Processing upload-complete for job_id: {job_id}, user: {user['user_id']}")
        
        try:
            response = supabase.table("documents").select("*").eq("id", job_id).eq("user_id", user["user_id"]).execute()
        except asyncio.TimeoutError:
            logger.error(f"[v0] Database query timeout for job_id: {job_id}")
            raise HTTPException(status_code=504, detail="Database query timeout")
        except Exception as db_error:
            logger.error(f"[v0] Database error querying documents: {str(db_error)}")
            raise HTTPException(status_code=500, detail="Database error")
        
        if not response.data:
            logger.warning(f"[v0] No document found for job_id: {job_id}, user: {user['user_id']}")
            raise HTTPException(status_code=404, detail="Job not found")
        
        document = response.data[0]
        logger.info(f"[v0] Found document: {document['filename']}, status: {document['status']}")
        
        if webhook_data.success:
            logger.info(f"[v0] Upload successful, updating status to processing for job_id: {job_id}")
            # Update status to processing and start processing
            try:
                await update_document_status(job_id, "processing", 0)
                logger.info(f"[v0] Document status updated to processing")
            except Exception as update_error:
                logger.error(f"[v0] Failed to update document status: {str(update_error)}")
                raise HTTPException(status_code=500, detail="Failed to update document status")
            
            # Start background processing
            asyncio.create_task(simulate_processing(job_id))
            logger.info(f"[v0] Background processing task created for job_id: {job_id}")
            
            return {
                "success": True,
                "message": "Upload confirmed. Document processing started. Status: PROCESSING",
                "job_id": job_id
            }
        else:
            logger.warning(f"[v0] Upload failed for job_id: {job_id}")
            # Upload failed
            try:
                await update_document_status(job_id, "failed", processing_log={"error": "File upload failed"})
            except Exception as update_error:
                logger.error(f"[v0] Failed to update failed status: {str(update_error)}")
            
            return {
                "success": False,
                "message": "Upload failed. Status: FAILED. Please try again.",
                "job_id": job_id
            }
    
    except HTTPException as http_exc:
        logger.error(f"[v0] HTTP Exception: {http_exc.detail}")
        raise
    except Exception as e:
        logger.error(f"[v0] Unexpected error in upload_complete_webhook: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")
