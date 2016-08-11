package com.leonyan.utils;

import aspose.pdf.Pdf;
import aspose.pdf.Section;
import aspose.pdf.Text;
import com.aspose.cells.Workbook;
import com.aspose.slides.Presentation;
import com.aspose.words.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * @author yanliang
 * @ClassName AsposeUtils
 * @Data 2015-08-27
 * @Description Aspose 文件转换工具类
 *
 */
public class AsposeUtils {

    private static final Logger LOG = LoggerFactory.getLogger(AsposeUtils.class);

    /**
     * 获取aspose.words license
     *
     * @return
     */
    public static boolean getWordsLicense() {
        boolean result = false;
        try {
            InputStream is = AsposeUtils.class.getClassLoader().getResourceAsStream("conf/aspose_words_license.xml");
            com.aspose.words.License aposeLic = new com.aspose.words.License();
            aposeLic.setLicense(is);
            result = true;
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
        }
        return result;
    }


    /**
     * 将word转成其他文件格式
     *
     * @param srcUrl
     * @param fileType
     */
    public static void wordToOther(String srcUrl, String destUrl,int fileType) {
        if (getWordsLicense()) {
            try {
                Document doc = new Document(srcUrl);
                doc.save(destUrl,fileType);
            } catch (Exception e) {
                LOG.error(e.getMessage(),e);
            }
        }
    }

    /**
     * 将word流转成其他文件格式
     *
     * @param srcStream
     * @param fileType
     */
    public static void wordToOther(InputStream srcStream, String destUrl,int fileType) {
        if (getWordsLicense()) {
            try {
                Document doc = new Document(srcStream);
                doc.save(destUrl,fileType);
            } catch (Exception e) {
                LOG.error(e.getMessage(),e);
            }
        }
    }

    /**
     * 将word流转成其他文件流格式
     *
     * @param srcStream
     * @param fileType
     * @param desOutStream
     */
    public static void wordToOther(InputStream srcStream, OutputStream desOutStream,int fileType) {
        if (getWordsLicense()) {
            try {
                Document doc = new Document(srcStream);
                doc.save(desOutStream,fileType);
            } catch (Exception e) {
                LOG.error(e.getMessage(),e);
            }
        }
    }


    /************************************ excel、ppt预览功能 因为加入这2个包会导致无法启动，在需要测试这个功能时再加进来 *********************************************/


    /**
     * 获取aspose.cells license
     *
     * @return
     */
    public static boolean getCellsLicense() {
        boolean result = false;
        try {
            InputStream is = AsposeUtils.class.getClassLoader().getResourceAsStream("conf/aspose_cells_license.xml");
            com.aspose.cells.License aposeLic = new com.aspose.cells.License();
            aposeLic.setLicense(is);
            result = true;
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
        }
        return result;
    }

    /**
     * 获取aspose.pdf license
     *
     * @return
     */
    public static boolean getPdfLicense() {
        boolean result = false;
        try {
            InputStream is = AsposeUtils.class.getClassLoader().getResourceAsStream("conf/aspose_pdf_license.xml");
            com.aspose.pdf.License aposeLic = new com.aspose.pdf.License();
            aposeLic.setLicense(is);
            result = true;
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
        }
        return result;
    }

    /**
     * 获取aspose.slides license
     *
     * @return
     */
    public static boolean getSlidesLicense() {
        boolean result = false;
        try {
            InputStream is = AsposeUtils.class.getClassLoader().getResourceAsStream("conf/aspose_slides_license.xml");
            com.aspose.slides.License aposeLic = new com.aspose.slides.License();
            aposeLic.setLicense(is);
            result = true;
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
        }
        return result;
    }

    /**
     * 转化excel文件为pdf
     * @param src 源文件
     * @param des 目标文件
     */
    public static void excelToOther(String src,String des,int fileType){
        //获取license
        if(!getCellsLicense()){
            return;
        }

        try {
            //Instantiate a new workbook with Excel file path
            Workbook workbook = new Workbook(src);

            //Save the document in PDF format
            workbook.save(des,fileType);
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
        }
    }

    /**
     * 转化excel文件为pdf
     * @param srcStream 源文件流
     * @param des 目标文件
     */
    public static void excelToPdf(InputStream srcStream,String des,int fileType){
        //获取license
        if(!getCellsLicense()){
            return;
        }

        try {
            //Instantiate a new workbook with Excel file path
            Workbook workbook = new Workbook(srcStream);

            //Save the document in PDF format
            workbook.save(des,fileType);
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
        }
    }

    /**
     * 转化excel文件为pdf
     * @param srcStream 源文件流
     * @param desOutStream 目标文件
     */
    public static void excelToOther(InputStream srcStream,OutputStream desOutStream,int fileType){
        //获取license
        if(!getCellsLicense()){
            return;
        }

        try {
            //Instantiate a new workbook with Excel file path
            Workbook workbook = new Workbook(srcStream);

            //Save the document in PDF format
            workbook.save(desOutStream,fileType);
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
        }
    }



    /**
     * 转化ppt文件为pdf
     * @param src 源文件
     * @param des 目标文件
     */
    public static void pptToPdf(String src,String des,int fileType){
        //获取license
        if(!getSlidesLicense()){
            return;
        }

        try {
            //Instantiate a Presentation object that represents a presentation file
            Presentation pres = new Presentation(src);

            //Save the presentation to PDF with default options
            pres.save(des, fileType);
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
        }
    }

    /**
     * 转化ppt文件为pdf
     * @param srcStream 源文件流
     * @param des 目标文件
     */
    public static void pptToPdf(InputStream srcStream,String des,int fileType){
        //获取license
        if(!getSlidesLicense()){
            return;
        }

        try {
            //Instantiate a Presentation object that represents a presentation file
            Presentation pres = new Presentation(srcStream);

            //Save the presentation to PDF with default options
            pres.save(des, fileType);
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
        }
    }

    /**
     * 转换ppt文件流为其他文件流
     * @param srcStream
     * @param desOutStream
     * @param fileType
     */
    public static void pptToOther(InputStream srcStream,OutputStream desOutStream,int fileType){
        //获取license
        if(!getSlidesLicense()){
            return;
        }

        try {
            //Instantiate a Presentation object that represents a presentation file
            Presentation pres = new Presentation(srcStream);

            //Save the presentation to PDF with default options
            pres.save(desOutStream, fileType);
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
        }
    }

    /**
     * 将txt文件流转换为pdf文件流
     * @param srcStream
     * @param outputStream
     * @param charsetName
     * @return List<String> 服务器出现txt无法预览问题，将装换信息步骤放在返回值中
     */
    public static List<String> txtToPdf(InputStream srcStream,OutputStream outputStream,String charsetName) throws Exception{

        //转换txt的操作日志，定位在服务器下转换出的问题
        List<String> logInfo = new ArrayList<String>();

        LOG.info("开始转换txt文件...");
        logInfo.add("开始转换txt文件...");
        //获取license
        if(!getPdfLicense()){
            return null;
        }

        try {
            logInfo.add("Instantiate Pdf pbject by calling its empty constructor...");
            //Instantiate Pdf pbject by calling its empty constructor
            Pdf pdf1 = new Pdf();
            //Create a new section in the Pdf object
            Section sec1 = pdf1.getSections().add();

            logInfo.add("specify the font file name...");
            // specify the font file name Arial Unicode MS
            pdf1.getTextInfo().setFontName("Arial");
            // set the font of resultant PDF automatically
            pdf1.isAutoFontAdjusted(true);
            // include True Type font subset in resultant PDF
            pdf1.setUnicode();

            // Open the file that is the first
            // command line parameter
//            FileInputStream fstream = new FileInputStream(src);
            logInfo.add("Get the object of DataInputStream...");
            // Get the object of DataInputStream
            DataInputStream in = new DataInputStream(srcStream);
            BufferedReader br = new BufferedReader(new InputStreamReader(in,charsetName));
            String strLine;
            logInfo.add("Read File Line By Line...");
            //Read File Line By Line
            while ((strLine = br.readLine()) != null) {
                //Create a new text paragraph and pass the text to its constructor as argument
                Text text1 = new Text(sec1, strLine);
                sec1.getParagraphs().add(text1);
            }

            logInfo.add("Close the input stream...");
            //Close the input stream
            in.close();

            logInfo.add("Save the PDF file...");
            // Save the PDF file
            pdf1.save(outputStream);
            LOG.info("txt文件转换成功...");
        } catch (IOException e) {
            LOG.error(e.getMessage(),e);
            throw new IOException(e);
        } catch (Exception e) {
            LOG.error(e.getMessage(),e);
            throw new Exception(e);
        }
        return logInfo;
    }

    /**
     * @Title: getCharset
     * @Description: java获取txt文件编码格式
     * @param inputStream
     * @return
     * @throws IOException
     */
    public static String getCharset(InputStream inputStream) throws IOException {

        BufferedInputStream bin = new BufferedInputStream(inputStream);
        int p = (bin.read() << 8) + bin.read();

        String code = null;

        switch (p) {
            case 0xefbb:
                code = "UTF-8";
                break;
            case 0xfffe:
                code = "Unicode";
                break;
            case 0xfeff:
                code = "UTF-16BE";
                break;
            default:
                code = "GBK";
        }
        return code;
    }

}
