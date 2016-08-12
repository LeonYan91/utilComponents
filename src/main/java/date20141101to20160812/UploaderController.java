/*******************************************************************************
 * Copyright (c) 2005, 2014 www.yineng.com
 *
 * <li>文件名称: UploaderController.java</li>
 * <li>文件描述: </li>
 * <li>内容摘要: </li>
 * <li>其他说明: </li>
 * <li>完成日期：2014-10-23</li>
 * <li>最后修改: YINENG</li>
 * <li>@version 1.0</li>
 * <li>@author YINENG</li>
 *******************************************************************************/
package date20141101to20160812;

import com.aspose.words.SaveFormat;
import com.yineng.api.PlatformException;
import com.yineng.api.platform.security.vo.PlatformSecurityUserVO;
import com.yineng.common.bean.JsonBean;
import com.yineng.core.utils.*;
import com.yineng.platform.domain.FileDataMetaTempVO;
import com.yineng.util.AsposeUtils;
import com.yineng.util.FastFSBusinessUploader;
import com.yineng.util.FileCombine;
import com.yineng.util.Md5;
import org.csource.common.MyException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.*;
import java.net.URISyntaxException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * The Class UploaderController.
 */
@Controller
@RequestMapping("/file/")
public class UploaderController {

    /** The log. */
    private static final Logger LOG = LoggerFactory.getLogger(UploaderController.class);

    /** The prefix_path. */
    private static String prefix_path;

    private static  final String Temp = "temp";
    private static final String TEMP_PREVIEW_PDF = "previewFile.pdf";

    static {
        try {
            String classPath = UploaderController.class.getResource("/").toURI().getPath();
            File classesDir = new File(classPath);
            prefix_path = classesDir.getParent() + File.separator + "upload";
        } catch (URISyntaxException e) {
            LOG.error(e.getMessage(), e);
        }
    }

    public static final String EXCEL_FILE_CONTENT = "import_excel_file_content";

    public static final String FILE_PATH="upload_file_path";

    @Autowired
    private  RedisTemplate<String,byte[]> redisTemplate;

    @RequestMapping("uploadAtServer")
    @ResponseBody
    public String uploadAtServer(String filePath,String username,HttpServletRequest request){

        String contextPath = request.getServletContext().getRealPath("/");
        String realPath = contextPath+filePath.substring(request.getContextPath().length());
        LOG.info(realPath);

        String fastDFSId = "0";
        File file = new File(realPath);
        try {
            LOG.info(file.getPath());
            fastDFSId = FastFSBusinessUploader.uploadToFileDataMetaTemp(file);
            LOG.info(fastDFSId);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return fastDFSId;
    }

    /**
     * Upload.
     *
     * @param request the request
     * @return the string
     */
    @RequestMapping("upload")
    @ResponseBody
    public String upload(HttpServletRequest request){
        LOG.info("/file/upload.htm is requested....");
        print(request);
        MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) request;
        // 得到上传的文件map集合对象
        Map<String, MultipartFile> fileMap = multipartRequest.getFileMap();
        // 循环遍历存放上传对象
        String chunks = request.getParameter("chunks");
        String chunk = request.getParameter("chunk");
        String id = request.getParameter("id");
        String type = request.getParameter("type");
        String size = request.getParameter("size");
        String fileName = null;
        for (Map.Entry<String, MultipartFile> entity : fileMap.entrySet()) {
            // 上传文件
            MultipartFile mf = entity.getValue();
            fileName = mf.getOriginalFilename();
            LOG.info(mf.getName());
            LOG.info(mf.getContentType());
            LOG.info(mf.getOriginalFilename());

            String folder = getTempFolderName(id, fileName, type, size);
            String chunkPath=prefix_path + "/" + folder + "/" + chunk
                    + "_" + chunks + "." + getSuffix(mf.getOriginalFilename());
            File uploadFile = new File(chunkPath);
            //如果文件已经存在，则删除原有文件
            if (uploadFile.exists()) {
                LOG.info("---文件(" + uploadFile + ") ||  已经存在，删除原有文件!---");
                uploadFile.delete();
            }
            //大文件上传
            try {
                FileUtils.copyInputStreamToFile(mf.getInputStream(), uploadFile);
                LOG.info("上传成功");
            } catch (IOException e) {
                LOG.error(e.getMessage(), e);
            }

        }

        return "Hello World";
    }

    /**
     * 不分片上传
     * @param request
     * @param session
     */
    @RequestMapping(value="uploadNoChunk",method = RequestMethod.POST)
    @ResponseBody
    public void uploadNoChunk(HttpServletRequest request, HttpSession session){
        MultipartHttpServletRequest multiPartRequest = (MultipartHttpServletRequest) request;
        MultipartFile multipartFile = multiPartRequest.getFile("file");
        if(multipartFile!=null){
            try {
                String key;
                PlatformSecurityUserVO platformSecurityUserVO = (PlatformSecurityUserVO) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                key = "TEMP_EXCEL_" + platformSecurityUserVO.getPlatformSysUserVO().getId() + new Date().getTime();
                redisTemplate.opsForValue().set(key, multipartFile.getBytes(), 1, TimeUnit.DAYS);
                session.setAttribute(EXCEL_FILE_CONTENT, key);
            } catch (IOException e) {
                LOG.error(e.getMessage(), e);
            }
        }
    }
    /**
     * Merge file.
     *
     * @param request the request
     * @param session the session
     * @return the string
     * @throws IOException Signals that an I/O exception has occurred.
     */
    @RequestMapping(value="mergeFile",method = RequestMethod.POST)
    @ResponseBody
    public String mergeFile(HttpServletRequest request,
                            HttpSession session) throws Exception {
        LOG.info("============请求合并开始");
        Map r = new HashMap();
        String id = request.getParameter("id");
        String type = request.getParameter("type");
        String size = request.getParameter("size");
        String fileName = request.getParameter("name");
        String filePath = request.getServletContext().getRealPath("/");
        LOG.info("=" + id + "=" + type + "=" + size + "="
                + "fileName" + "=" + filePath);
        String folder = getTempFolderName(id, fileName, type, size);
        String megerFolder = prefix_path + "/" + folder;
        List<File> files = new ArrayList<File>();
        File directory = new File(megerFolder);
        for (File tmpFile : directory.listFiles()) {
            files.add(tmpFile);// 填充文件
        }
        // 文件按片排序
        Collections.sort(files, new Comparator<File>() {
            @Override
            public int compare(File o1, File o2) {
                int result = 0;
                String name1 = o1.getName();
                int sortName1 = Integer.parseInt(name1.split("_")[0]);
                String name2 = o2.getName();
                int sortName2 = Integer.parseInt(name2.split("_")[0]);
                if (sortName1 > sortName2) {
                    result = 1;
                } else if (sortName1 < sortName2) {
                    result = -1;
                } else {
                    result = 0;
                }
                return result;
            }
        });
        FileCombine fc = new FileCombine();
        String targetName = prefix_path + "/" + fileName;
        File file = fc.combineFiles(files, targetName);
        r.put("result", 1);
        LOG.info("============请求合并结束");
        FileUtils.deleteDirectory(directory);
        String fastDFSId = "1";
        if(request.getParameter("uploadToFDFS")!=null) {//需要上传到fastDFS
            fastDFSId = FastFSBusinessUploader.uploadToFileDataMetaTemp(file);
        }else if(request.getParameter("importStaffHead")!=null){
            session.setAttribute(FILE_PATH,file.getAbsolutePath());
            return "1";
        }else{
            session.setAttribute(EXCEL_FILE_CONTENT, FileUtils.read(file));
        }
        if(file.exists()){
            file.delete();
        }
        return fastDFSId;
    }

    /**
     * 通过文件在fastDFSiD,重fastDFS下载文件
     * @param fastDFSId
     * @return
     */
    @RequestMapping("downloadHeader")
    @ResponseBody
    private String downloadHeaderFastDFS(String fastDFSId){
        Map<String,String> map = new HashMap<>();
        map.put("fdfsId",fastDFSId);
        String downloadPath = PropertyUtils.getString("downloadFileMetaDataTemp");
        String jsonString =  HttpRequestUtils.get(downloadPath, map);
        if(StringUtils.isBlank(jsonString)){
            return null;
        }
        FileDataMetaTempVO fileDataMetaTempVO = JSONUtils.json2Obj(jsonString,FileDataMetaTempVO.class);
        ServletOutputStream out = null;
        FileOutputStream fos = null;
        FileChannel channel = null;
        try {
            String groupName = fileDataMetaTempVO.getServerGroupName();
            String filename = fileDataMetaTempVO.getFileURLMappingId();
            byte[] bytes = FastFSUtils.download(groupName, filename);
            File file = new File(fileDataMetaTempVO.getBasePath());
            if(!file.exists()){
                file.createNewFile();
            }
            fos = new FileOutputStream(file);
            channel = fos.getChannel();
            ByteBuffer buffer = ByteBuffer.allocateDirect(8192);
            int count = bytes.length;
            int writeCount = 0;
            while(writeCount < count){
                int curWirte = count - writeCount > buffer.remaining() ? buffer.remaining():count - writeCount;
                buffer.put(bytes, writeCount, curWirte);
                buffer.flip();
                writeCount += channel.write(buffer);
                buffer.compact();
            }
        } catch (IOException e) {
            LOG.error(e.getMessage(),e);
        } finally{
            try {
                if(out!=null){
                    out.close();
                }
                if(channel!=null){
                    channel.close();
                }
                if(fos!=null){
                    fos.close();
                }
            } catch (IOException e) {
                LOG.error(e.getMessage(),e);
            }
        }
        return fileDataMetaTempVO.getBasePath();
    }

    /**
     * 通过文件在fastDFSiD,重fastDFS下载文件
     * @param fastDFSId
     * @return
     */
    @RequestMapping("download")
    @ResponseBody
    private String downloadFastDFS(String fastDFSId,HttpServletResponse response){
        Map<String,String> map = new HashMap<>();
        map.put("fdfsId",fastDFSId);
        String downloadPath = PropertyUtils.getString("downloadFileMetaDataTemp");
        String jsonString =  HttpRequestUtils.get(downloadPath, map);
        if(StringUtils.isBlank(jsonString)){
            return null;
        }
        FileDataMetaTempVO fileDataMetaTempVO = JSONUtils.json2Obj(jsonString,FileDataMetaTempVO.class);
        ServletOutputStream out = null;
        FileOutputStream fos = null;
        FileChannel channel = null;
        try {
            String groupName = fileDataMetaTempVO.getServerGroupName();
            String filename = fileDataMetaTempVO.getFileURLMappingId();
            byte[] bytes = FastFSUtils.download(groupName, filename);
            File file = new File(fileDataMetaTempVO.getBasePath());
            if(fileDataMetaTempVO!=null&&fileDataMetaTempVO.getBasePath()!=null) {
                String tempDir = "";
                if(fileDataMetaTempVO.getBasePath().contains("\\")){
                    tempDir = fileDataMetaTempVO.getBasePath().substring(0, fileDataMetaTempVO.getBasePath().lastIndexOf("\\"));
                }else if(fileDataMetaTempVO.getBasePath().contains("/")){
                    tempDir = fileDataMetaTempVO.getBasePath().substring(0, fileDataMetaTempVO.getBasePath().lastIndexOf("/"));
                }else{
                    tempDir = fileDataMetaTempVO.getBasePath().substring(0, fileDataMetaTempVO.getBasePath().lastIndexOf(File.separator));
                }

                File dir =  new File(tempDir);
                if(!dir.exists()){
                    dir.mkdir();
                }
            }
            if(!file.exists()){
                file.createNewFile();
            }
            fos = new FileOutputStream(file);
            channel = fos.getChannel();
            ByteBuffer buffer = ByteBuffer.allocateDirect(8192);
            int count = bytes.length;
            int writeCount = 0;
            while(writeCount < count){
                int curWirte = count - writeCount > buffer.remaining() ? buffer.remaining():count - writeCount;
                buffer.put(bytes, writeCount, curWirte);
                buffer.flip();
                writeCount += channel.write(buffer);
                buffer.compact();
            }
            if(StringUtils.isNotEmpty(fileDataMetaTempVO.getBasePath())){
                String allFileName = fileDataMetaTempVO.getBasePath();
                String showfileName = fileDataMetaTempVO.getBasePath().substring(allFileName.lastIndexOf(File.separator)+1);
                String ext = fileDataMetaTempVO.getBasePath().substring(allFileName.lastIndexOf(".")+1,allFileName.length());
                if(ext.toLowerCase().endsWith("zip")){
                    response.setContentType("application/x-zip-compressed");
                }else if(ext.toLowerCase().endsWith("rar")){
                    response.setContentType("application/octet-stream");
                }else if(ext.toLowerCase().endsWith("doc")){
                    response.setContentType("application/msword");
                }else if(ext.toLowerCase().endsWith("xls") || ext.toLowerCase().endsWith("csv")){
                    response.setContentType("application/ms-excel ");
                }else if (ext.toLowerCase().endsWith("pdf")){
                    response.setContentType("application/pdf");
                }else{
                    response.setContentType("application/x-msdownload");
                }
                response.addHeader("Content-Disposition", "attachment;filename="
                        + new String(showfileName.getBytes("gb2312"), "iso-8859-1"));
            }
            out = response.getOutputStream();
            out.write(bytes);
        } catch (IOException e) {
            LOG.error(e.getMessage(),e);
        } finally{
            try {
                if(out!=null){
                    out.close();
                }
                if(channel!=null){
                    channel.close();
                }
                if(fos!=null){
                    fos.close();
                }
            } catch (IOException e) {
                LOG.error(e.getMessage(),e);
            }
        }
        return fileDataMetaTempVO.getBasePath();
    }


    /**
     * 通过文件在fastDFSiD,重fastDFS下载文件
     * @param fastDFSId
     * @return
     */
    @RequestMapping("downloadStream")
    @ResponseBody
    private String downloadStreamFastDFS(String fastDFSId,HttpServletResponse response){
        Map<String,String> map = new HashMap<>();
        map.put("fdfsId",fastDFSId);
        if(fastDFSId.equalsIgnoreCase("undefined")){
            return null;
        }
        String downloadPath = PropertyUtils.getString("downloadFileMetaDataTemp");
        String jsonString =  HttpRequestUtils.get(downloadPath, map);
        if(StringUtils.isBlank(jsonString)){
            return null;
        }
        FileDataMetaTempVO fileDataMetaTempVO = JSONUtils.json2Obj(jsonString,FileDataMetaTempVO.class);
        ServletOutputStream out = null;
        try {
            String groupName = fileDataMetaTempVO.getServerGroupName();
            String filename = fileDataMetaTempVO.getFileURLMappingId();
            byte[] bytes = FastFSUtils.download(groupName, filename);
            response.setContentType("application/octet-stream");
            if(StringUtils.isNotEmpty(fileDataMetaTempVO.getBasePath())){
                String showfileName = fileDataMetaTempVO.getBasePath().substring(fileDataMetaTempVO.getBasePath().lastIndexOf(File.separator)+1);
                response.addHeader("Content-Disposition", "attachment;filename="+ new String(showfileName.getBytes("gb2312"), "iso-8859-1"));
            }
            out = response.getOutputStream();
            if(bytes!=null){
                out.write(bytes);
            }
        } catch (IOException e) {
            LOG.error(e.getMessage(),e);
        } finally{
            try {
                if(out!=null){
                    out.close();
                }
            } catch (IOException e) {
                LOG.error(e.getMessage(),e);
            }
        }
        return fileDataMetaTempVO.getBasePath();
    }

    /**
     * 从fastDFS上下载文件到本地
     * @param fileId
     * @param targetDir
     * @param fileName
     */
    public String downLoadFromFastDFS(String fileId,String targetDir,String fileName){
        Map<String,String> map = new HashMap<>();
        map.put("fdfsId",fileId);
        String jsonString =  HttpRequestUtils.get(PropertyUtils.getString("downloadFileMetaDataTemp"), map);
        if(StringUtils.isBlank(jsonString)){
            return null;
        }
        FileDataMetaTempVO fileDataMetaTempVO = JSONUtils.json2Obj(jsonString,FileDataMetaTempVO.class);
        FileOutputStream fos=null;
        FileChannel channel = null;
        try {
            String groupName = fileDataMetaTempVO.getServerGroupName();
            String sourcePath=fileDataMetaTempVO.getBasePath();
            String suffix="";
            int index=sourcePath.lastIndexOf(File.separator);
            if(index==-1){
                return null;
            }
            String sourceFileName=sourcePath.substring(index+1);
            int dotIndex=sourceFileName.lastIndexOf(".");
            if(dotIndex!=-1){
                suffix=sourceFileName.substring(dotIndex);
            }
            byte[] bytes = FastFSUtils.download(groupName, fileDataMetaTempVO.getFileURLMappingId());
            File file = new File(targetDir+File.separator+fileName+suffix);
            if(!file.exists()){
                file.createNewFile();
            }
            fos = new FileOutputStream(file);
            channel = fos.getChannel();

            ByteBuffer buffer = ByteBuffer.allocateDirect(8192);
            int count = bytes.length;
            int writeCount = 0;
            while(writeCount < count){
                int curWirte = count - writeCount > buffer.remaining() ? buffer.remaining():count - writeCount;
                buffer.put(bytes, writeCount, curWirte);
                buffer.flip();
                writeCount += channel.write(buffer);
                buffer.compact();
            }
            return fileName+suffix;
        } catch (IOException e) {
            LOG.error(e.getMessage(),e);
        } finally{
            try {
                if(channel!=null){
                    channel.close();
                }
                if(fos!=null){
                    fos.close();
                }
            } catch (IOException e) {
                LOG.error(e.getMessage(),e);
            }
        }
        return null;
    }

    @RequestMapping("delete")
    @ResponseBody
    public String deleteFastDFS(String fastDFSId){
        try {
            FastFSBusinessUploader.deleteFastDFS(fastDFSId);
        }catch (Exception e){
            LOG.error(e.getMessage(),e);
            return "error";
        }
        return "success";
    }


    /**
     * 预览功能
     * 将文件先装换成pdf，再预览
     * @author yanliang
     * @param fastDFSId
     * @param request
     * @return
     */
    @RequestMapping("previewFile")
    @ResponseBody
    public JsonBean previewFile(String fastDFSId,HttpServletRequest request, HttpServletResponse response){
        //临时文件存放
//        String previewFile = request.getServletContext().getRealPath("")+File.separator+Temp+File.separator+TEMP_PREVIEW_PDF;

        Map<String,String> map = new HashMap<>();
        map.put("fdfsId",fastDFSId);
        String downloadPath = PropertyUtils.getString("downloadFileMetaDataTemp");
        String jsonString =  HttpRequestUtils.get(downloadPath, map);
        if(StringUtils.isBlank(jsonString)){
            return null;
        }
        FileDataMetaTempVO fileDataMetaTempVO = JSONUtils.json2Obj(jsonString, FileDataMetaTempVO.class);
        ServletOutputStream out = null;
        FileOutputStream fos = null;
        FileChannel channel = null;
        InputStream is = null;
        try {

            String groupName = fileDataMetaTempVO.getServerGroupName();
            String filename = fileDataMetaTempVO.getFileURLMappingId();

            String ext = null;
            //获取文件的类型
            if(StringUtils.isNotEmpty(fileDataMetaTempVO.getBasePath())){
                String allFileName = fileDataMetaTempVO.getBasePath();
                ext = fileDataMetaTempVO.getBasePath().substring(allFileName.lastIndexOf(".")+1,allFileName.length());
            }

            //根据fastId拿到文件的bytes
            byte[] bytes = FastFSUtils.download(groupName, filename);

            is = new ByteArrayInputStream(bytes);

            //设置resonse的contentType
            response.setContentType("application/pdf");
            response.addHeader("Content-Disposition", "attachment;filename="
                    + new String("pdfViewer".getBytes("gb2312"), "iso-8859-1"));

            //取得response的文件流
            OutputStream outputStream = response.getOutputStream();
            switch (ext) {
                //pdf
                case "pdf" :
                    outputStream.write(bytes);
                //WORD
                case "docx":
                    AsposeUtils.wordToOther(is,outputStream,SaveFormat.PDF);
                    break;
                case "doc":
                    AsposeUtils.wordToOther(is,outputStream,SaveFormat.PDF);
                    break;
                /************************************ excel、ppt预览功能 因为加入这2个包会导致无法启动，在需要测试这个功能时再加进来 *********************************************/
                //EXCEL
                case "xls":
                    AsposeUtils.excelToOther(is, outputStream, com.aspose.cells.SaveFormat.PDF);
                    break;
                case "xlsx":
                    AsposeUtils.excelToOther(is, outputStream, com.aspose.cells.SaveFormat.PDF);
                    break;
                //PPT
                case "ppt":
                    AsposeUtils.pptToOther(is, outputStream, com.aspose.slides.SaveFormat.Pdf);
                    break;
                case "pptx":
                    AsposeUtils.pptToOther(is, outputStream, com.aspose.slides.SaveFormat.Pdf);
                    break;
                //TXT
                case "txt":
                    //需要重新new一个inputStream,直接用原来的inputStream解析字符集会更改原来的流
                    InputStream stm = new ByteArrayInputStream(bytes);
                    String charset = AsposeUtils.getCharset(stm);
                    List<String> logInfo = AsposeUtils.txtToPdf(is,outputStream,charset);
                    return new JsonBean(logInfo);
//                    break;
//                //TXT
//                case "txt":
//                    //需要重新new一个inputStream,直接用原来的inputStream解析字符集会更改原来的流
//                    InputStream stm = new ByteArrayInputStream(bytes);
//                    String charset = AsposeUtils.getCharset(stm);
//                    AsposeUtils.txtToPdf(is,outputStream,charset);
//                    break;
            }

            return new JsonBean();
        } catch (IOException e) {
            LOG.error(e.getMessage(),e);
            return new JsonBean(e.getMessage(),1);
        } catch (MyException e) {
            LOG.error(e.getMessage(),e);
            return new JsonBean(e.getMessage(),2);
        } catch (URISyntaxException e) {
            LOG.error(e.getMessage(),e);
            return new JsonBean(e.getMessage(),3);
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
            return new JsonBean(e.getMessage(),4);
        } finally{
            try {
                if(out!=null){
                    out.close();
                }
                if(channel!=null){
                    channel.close();
                }
                if(fos!=null){
                    fos.close();
                }
            } catch (IOException e) {
                LOG.error(e.getMessage(),e);
                return new JsonBean(e.getMessage(),5);
            }
        }
    }


    // 得到后缀名
    /**
     * Gets the suffix.
     *
     * @param file the file
     * @return the suffix
     */
    public static String getSuffix(String file) {
        String[] s = file.split("\\.");
        return s[s.length - 1];
    }

    /**
     * Gets the temp folder name.
     *
     * @param id the id
     * @param fileName the file name
     * @param type the type
     * @param size the size
     * @return the temp folder name
     */
    public String getTempFolderName(String id, String fileName, String type,
                                    String size) {
        String m = id + fileName + type + size;
        return "_" + Md5.md5(m);
    }

    /**
     * Prints the.
     *
     * @param req the req
     */
    public void print(HttpServletRequest req) {
        LOG.info("====para" + req.getParameterMap());
        LOG.info("chunks=" + req.getParameter("chunks"));
        LOG.info("chunk=" + req.getParameter("chunk"));
        LOG.info("id=" + req.getParameter("id"));
        LOG.info("lastModifiedDate=" + req.getParameter("lastModifiedDate"));
        LOG.info("type=" + req.getParameter("type"));
        LOG.info("size=" + req.getParameter("size"));
        LOG.info("uid=" + req.getParameter("uid"));
        LOG.info("====epara");
    }

    public String masterSlavePic(FileDataMetaTempVO masterVO,FileDataMetaTempVO slave1VO,FileDataMetaTempVO slave2VO) throws PlatformException {
        return FastFSBusinessUploader.uploadMasterSlaveFiles(masterVO,slave1VO,slave2VO);
    }
}
