package date20141101to20160812;

import com.yineng.core.utils.BeanUtils;
import com.yineng.corpsysland.base.page.CustomPageImpl;
import com.yineng.corpsysland.common.exception.YnCorpSysException;
import com.yineng.corpsysland.common.util.StringUtils;
import com.yineng.corpsysland.domain.*;
import com.yineng.corpsysland.repository.qjgl.projectmanage.QJGLProjectRoleTypeRepository;
import com.yineng.corpsysland.repository.xmgl.projectmanage.*;
import com.yineng.corpsysland.repository.xmgl.projecttemplate.XMGLProjectTemplateRepository;
import com.yineng.corpsysland.repository.xmgl.projecttemplate.XMGLTemplateTaskRepository;
import com.yineng.corpsysland.security.SecurityUtils;
import com.yineng.corpsysland.service.platform.common.PlatformCommonDictionaryService;
import com.yineng.corpsysland.service.rsgl.sysusermanagement.RSGLPersonOrganizatService;
import com.yineng.corpsysland.web.rest.rsgl.sysusermanagement.dto.RSGLSysUserDTO;
import com.yineng.corpsysland.web.rest.xmgl.projectmanage.dto.XMGLProjectDTO;
import com.yineng.corpsysland.web.rest.xmgl.projectmanage.dto.XMGLProjectQueryDTO;
import com.yineng.corpsysland.web.rest.xmgl.projectmanage.dto.XMGLRoleDTO;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import javax.persistence.criteria.*;
import javax.transaction.Transactional;
import java.util.*;

/**
 * @author yanliang
 * @ClassName XMGLProjectManageServiceImpl
 * @Description
 * @Date 2016/4/8
 */

@Transactional
@Service("xmglProjectManageService")
public class XMGLProjectManageServiceImpl implements XMGLProjectManageService{

    @Inject
    private XMGLProjectRepository xmglProjectRepository;

    @Inject
    private PlatformCommonDictionaryService platformCommonDictionaryService;

    @Inject
    private XMGLProjectTemplateRepository xmglProjectTemplateRepository;

    @Inject
    private XMGLTaskRepository xmglTaskRepository;

    @Inject
    private XMGLRoleRepository xmglRoleRepository;

    @Inject
    private XMGLRoleUserMiddleRepository xmglRoleUserMiddleRepository;

    @Inject
    private QJGLProjectRoleTypeRepository qjglProjectRoleTypeRepository;

    @Inject
    private RSGLPersonOrganizatService rsglPersonOrganizatService;

    @Inject
    private XMGLTemplateTaskRepository xmglTemplateTaskRepository;

    @Inject
    private XMGLExpectFileRepository xmglExpectFileRepository;

    @Inject
    private XMGLTaskService xmglTaskService;


    /** 所有权限字符串拼接 */
    //(20160510 modify by yanliang)没有‘文档查看(docView)’，‘文档编辑(docEdit)’权限
    private final String ALL_AUTH_CODE = "taskAdd_taskEdit_taskProgress_taskDel_taskImport_taskAudit" +
        "_issueAdd_issueEdit_issueDel_issueView" +
        "_riskAdd_riskEdit_riskDel_riskView" +
        "_docAdd_docDel_docPreview_docDown";

    /** 项目监理CODE */
    private final Byte SUPERVISOR_CODE = XMGLInitRoleEnum.SUPERVISOR.getCode();

    /** 项目经理CODE */
    private final Byte MANAGER_CODE = XMGLInitRoleEnum.MANAGER.getCode();

    /**
     * 分页查询项目信息
     *
     * @param queryDTO
     * @param pageable
     * @return
     */
    @Override
    public Page<XMGLProjectDTO> queryProjectByConditions(XMGLProjectQueryDTO queryDTO, Pageable pageable) throws YnCorpSysException {

        Page<XMGLProject> xmglProjectDTOPage = xmglProjectRepository.findAll(new Specification<XMGLProject>() {
            @Override
            public Predicate toPredicate(Root<XMGLProject> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
                List<Predicate> criteriaList = new LinkedList<Predicate>();
                criteriaList.add(criteriaBuilder.equal(root.get("isDel"),false));
                //项目编号
                if(StringUtils.isNotEmpty(queryDTO.getProjectNumber())){
                    criteriaList.add(criteriaBuilder.like(root.get("projectNumber"),"%"+queryDTO.getProjectNumber()+"%"));
                }
                //项目名称
                if(StringUtils.isNotEmpty(queryDTO.getProjectName())){
                    criteriaList.add(criteriaBuilder.like(root.get("projectName"),"%"+queryDTO.getProjectName()+"%"));
                }
                //项目经理
                if(StringUtils.isNotEmpty(queryDTO.getManagerStr())){
                    Subquery<XMGLRoleUserMiddle> subquery = criteriaQuery.subquery(XMGLRoleUserMiddle.class);
                    Root<XMGLRoleUserMiddle> roleRoot = subquery.from(XMGLRoleUserMiddle.class);
                    subquery.select(roleRoot);
                    subquery.where(
                        criteriaBuilder.equal(roleRoot.get("xmglRole").get("xmglProject"),root.get("id")),
                        criteriaBuilder.like(roleRoot.get("rsglSysUser").get("name"),"%"+queryDTO.getManagerStr()+"%"),
                        criteriaBuilder.equal(roleRoot.get("xmglRole").get("initRoleType"), MANAGER_CODE)
                    );
                    criteriaList.add(criteriaBuilder.exists(subquery));
                }
                //项目类型
                if(queryDTO.getProjectType() != null){
                    criteriaList.add(criteriaBuilder.equal(root.get("qjglProjectSubtype").get("projectTypeCode"),queryDTO.getProjectType()));
                }
                //项目子类
                if(queryDTO.getSubProjectTypeId() != null) {
                    criteriaList.add(criteriaBuilder.equal(root.get("qjglProjectSubtype").get("id"),queryDTO.getSubProjectTypeId()));
                }
                //项目状态
                if(CollectionUtils.isNotEmpty(queryDTO.getProjectStatusList())){
                    criteriaList.add(root.get("projectStatus").in(queryDTO.getProjectStatusList()));
                }
                //计划开始时间 时间查询类型 1：按计划开始时间，2：按计划结束时间，3：按实际开始时间，4：按实际结束时间
                if(queryDTO.getQueryDateType() != null && (queryDTO.getQueryStartDate() != null || queryDTO.getQueryEndDate() != null)){
                    String queryDateStr = null;
                    switch (queryDTO.getQueryDateType()){
                        case 1 :
                            queryDateStr = "planStartDate";
                            break;
                        case 2 :
                            queryDateStr = "planEndDate";
                            break;
                        case 3 :
                            queryDateStr = "actualStartDate";
                            break;
                        case 4 :
                            queryDateStr = "actualEndDate";
                            break;
                        default:
                            queryDateStr = "planStartDate";
                    }
                    if(queryDTO.getQueryStartDate() != null && queryDTO.getQueryEndDate() != null){
                        criteriaList.add(criteriaBuilder.between(root.get(queryDateStr), queryDTO.getQueryStartDate(),queryDTO.getQueryEndDate()));
                    }else if(queryDTO.getQueryStartDate() != null){
                        criteriaList.add(criteriaBuilder.greaterThanOrEqualTo(root.get(queryDateStr), queryDTO.getQueryStartDate()));
                    }else if(queryDTO.getQueryEndDate() != null){
                        criteriaList.add(criteriaBuilder.lessThanOrEqualTo(root.get(queryDateStr), queryDTO.getQueryEndDate()));
                    }
                }
                //我的：项目类型
                if(queryDTO.getInvolvedProjectType() != null){
                    Subquery<XMGLRoleUserMiddle> subquery = criteriaQuery.subquery(XMGLRoleUserMiddle.class);
                    Root<XMGLRoleUserMiddle> roleRoot = subquery.from(XMGLRoleUserMiddle.class);
                    subquery.select(roleRoot);

                    switch (queryDTO.getInvolvedProjectType()){
                        case 1:
                            //我参与的项目 查询出不是 但是是其他项目成员的
                            subquery.where(
                                criteriaBuilder.equal(roleRoot.get("xmglRole").get("xmglProject"),root.get("id")),
                                criteriaBuilder.equal(roleRoot.get("rsglSysUser").get("id"),SecurityUtils.getRSGLSysUserId()),
                                criteriaBuilder.isNull(roleRoot.get("xmglRole").get("initRoleType"))
                            );
                            break;
                        case 2:
                            //我管理的 作为 项目经理
                            subquery.where(
                                criteriaBuilder.equal(roleRoot.get("xmglRole").get("xmglProject"),root.get("id")),
                                criteriaBuilder.equal(roleRoot.get("rsglSysUser").get("id"),SecurityUtils.getRSGLSysUserId()),
                                criteriaBuilder.equal(roleRoot.get("xmglRole").get("initRoleType"),MANAGER_CODE)
                            );

                            break;
                        case 3:
                            //我监理的
                            subquery.where(
                                criteriaBuilder.equal(roleRoot.get("xmglRole").get("xmglProject"),root.get("id")),
                                criteriaBuilder.equal(roleRoot.get("rsglSysUser").get("id"),SecurityUtils.getRSGLSysUserId()),
                                criteriaBuilder.equal(roleRoot.get("xmglRole").get("initRoleType"),SUPERVISOR_CODE)
                            );
                            break;
                        case 4:
                            //查询出 我管理，我监理，我参与的，意思是只要有个我有个一个角色的
                            subquery.where(
                                criteriaBuilder.equal(roleRoot.get("xmglRole").get("xmglProject"),root.get("id")),
                                criteriaBuilder.equal(roleRoot.get("rsglSysUser").get("id"),SecurityUtils.getRSGLSysUserId())
                            );
                    }
                    criteriaList.add(criteriaBuilder.exists(subquery));

                }

                criteriaQuery.orderBy(criteriaBuilder.asc(root.get("projectStatus")));
                Predicate[] predicates = new Predicate[criteriaList.size()];
                criteriaQuery.where(criteriaList.toArray(predicates));
                return null;
            }
        },pageable);

        List<XMGLProjectDTO> xmglProjectDTOList = convertDTOList(xmglProjectDTOPage.getContent());

        Page<XMGLProjectDTO> pageResult = new CustomPageImpl<>(xmglProjectDTOList,pageable,xmglProjectDTOPage.getTotalElements());

        return pageResult;
    }

    /**
     * 查询单个项目
     *
     * @param id
     * @return
     */
    @Override
    public XMGLProjectDTO queryProjectById(Long id) throws YnCorpSysException {
        XMGLProject xmglProject = xmglProjectRepository.findOne(id);
        if(xmglProject == null){
            throw new YnCorpSysException("项目不存在！");
        }
        //转换基本信息
        XMGLProjectDTO xmglProjectDTO = convertDTO(xmglProject);
        //主负责部门
        PlatformSysOrganization organization = xmglProject.getResponsibleOrg();
        if(organization != null){
            xmglProjectDTO.setResponsibleOrgId(organization.getId());
            xmglProjectDTO.setResponsibleOrgStr(organization.getName());
        }
        //项目创建人
        RSGLSysUser creator = xmglProject.getProjectCreator();
        if(creator != null){
            xmglProjectDTO.setCreatorId(creator.getId());
            xmglProjectDTO.setCreatorStr(creator.getName());
        }
        //查询角色信息
        xmglProjectDTO.setXmglRoleDTOList(getXMGLRoleList(xmglProject.getXmglRoleList(),xmglProject.getQjglProjectSubtype().getId()));

        return xmglProjectDTO;
    }

    /**
     * 生成项目角色
     * @param xmglRoleList
     * @return
     */
    private List<XMGLRoleDTO> getXMGLRoleList(List<XMGLRole> xmglRoleList,Long subTypeId){
        List<XMGLRoleDTO> xmglRoleDTOList = new LinkedList<XMGLRoleDTO>();
        Iterator<XMGLRole> roleIterator = xmglRoleList.iterator();
        while(roleIterator.hasNext()){
            XMGLRole role = roleIterator.next();
            XMGLRoleDTO roleDTO = new XMGLRoleDTO();
            //拷贝基本数据
            BeanUtils.copyProperties(role,roleDTO);
            //项目子类角色
            QJGLProjectRoleType roleType = role.getQjglProjectRoleType();
            if(roleType != null){
                roleDTO.setRoleTypeId(roleType.getId());
                roleDTO.setRoleName(roleType.getName());
            }else if(role.getInitRoleType() != null){
                //初始角色
                roleDTO.setRoleName(XMGLInitRoleEnum.getName(role.getInitRoleType()));
            }else{
                //不是项目角色，也不是处理角色，此角色有问题，跳过
                continue;
            }

            //查询相关用户信息
            List<RSGLSysUserDTO> userDTOList = new ArrayList<>();
            for(XMGLRoleUserMiddle middle : role.getXmglRoleUserMiddles()){
                RSGLSysUser sysUser = middle.getRsglSysUser();
                if(sysUser == null){
                    continue;
                }
                RSGLSysUserDTO userDTO = new RSGLSysUserDTO();
                userDTO.setId(sysUser.getId());
                userDTO.setName(sysUser.getName());
                userDTO.setJobNumber(sysUser.getJobNumber());
                userDTOList.add(userDTO);
            }
            //在角色中添加用户组
            roleDTO.setUserDTOList(userDTOList);
            xmglRoleDTOList.add(roleDTO);
        }
        //查询此项目子类下是否还有其他新角色
        List<XMGLRoleDTO> freshRoleList = getSubTypeRoleList(subTypeId);
        if(CollectionUtils.isNotEmpty(freshRoleList)){
            freshRoleList.removeAll(xmglRoleDTOList);
            xmglRoleDTOList.addAll(freshRoleList);
        }
        return xmglRoleDTOList;
    }

    /**
     * 通过id数组查询多个项目信息
     *
     * @param ids
     * @return
     */
    @Override
    public List<XMGLProjectDTO> queryProjectListByIds(Long[] ids) throws YnCorpSysException {
        List<XMGLProject> projectList = xmglProjectRepository.findByIds(ids);
        List<XMGLProjectDTO> xmglProjectDTOList = convertDTOList(projectList);
        return xmglProjectDTOList;
    }

    /**
     * 添加或者修改项目
     *
     * @param xmglProjectDTO
     */
    @Override
    public void addOrUpdateProject(XMGLProjectDTO xmglProjectDTO) throws YnCorpSysException {
        XMGLProject xmglProject = null;
        int count = 0;
        //项目编号重复验证计数
        int proNumCount = 0;
        if(xmglProjectDTO.getId() != null){
            count = xmglProjectRepository.countProjectNameNotCurrent(xmglProjectDTO.getProjectName(),xmglProjectDTO.getSubProjectTypeId(),xmglProjectDTO.getId());
            //编号重复验证
            proNumCount = xmglProjectRepository.countProjectProjectNumberNotCurrent(xmglProjectDTO.getProjectNumber(), xmglProjectDTO.getId());

            //修改
            xmglProject = xmglProjectRepository.findOne(xmglProjectDTO.getId());
            if(xmglProject == null){
                throw new YnCorpSysException("项目不存在！");
            }
        }else{
            count = xmglProjectRepository.countProjectName(xmglProjectDTO.getProjectName(),xmglProjectDTO.getSubProjectTypeId());
            //编号重复验证
            proNumCount = xmglProjectRepository.countProjectNumber(xmglProjectDTO.getProjectNumber());

            //添加
            xmglProject = new XMGLProject();
        }
        if(count >= 1){
            throw new YnCorpSysException("此项目子类下项目名称重复！");
        }
        if(proNumCount >= 1)
            throw new YnCorpSysException("项目编号重复");
        //拷贝基本信息
        BeanUtils.copyProperties(xmglProjectDTO,xmglProject);
        //如果是添加
        //1、创建人为当前用户
        //2、根据项目模板生成项目任务
        //3.保存模板ID
        //4、删除false
        if(xmglProjectDTO.getId() == null){
            xmglProject.setIsDel(false);
            RSGLSysUser creator = new RSGLSysUser();
            creator.setId(SecurityUtils.getRSGLSysUserId());
            xmglProject.setProjectCreator(creator);
            //项目模板
            if(xmglProjectDTO.getProjectTemplateId() != null){
                //将项目模板的任务复制到项目任务中
                saveTaskByTemplateId(xmglProject,xmglProjectDTO.getProjectTemplateId());
                //保存模板
                XMGLProjectTemplate template = new XMGLProjectTemplate();
                template.setId(xmglProjectDTO.getProjectTemplateId());
                xmglProject.setXmglProjectTemplate(template);
            }
        }else
            //(20160606 add by yanliang)如果有修改项目进度，同时修改实际结束时间
            this.xmglTaskService.updateActualDate(xmglProjectDTO.getId(),(xmglProjectDTO.getProjectProgress() == null || xmglProjectDTO.getProjectProgress() < 100) ? (byte)2 : (byte)3);

        //项目子类
        QJGLProjectSubtype subtype = new QJGLProjectSubtype();
        subtype.setId(xmglProjectDTO.getSubProjectTypeId());
        xmglProject.setQjglProjectSubtype(subtype);
        //主责任部门
        PlatformSysOrganization organization = new PlatformSysOrganization();
        organization.setId(xmglProjectDTO.getResponsibleOrgId());
        xmglProject.setResponsibleOrg(organization);
        //保存角色
        saveRole(xmglProjectDTO.getXmglRoleDTOList(),xmglProject);

        //保存项目
        xmglProjectRepository.save(xmglProject);

    }

    /**
     * 保存项目模板
     * @param xmglProject
     * @param projectTemplateId
     */
    private void saveTaskByTemplateId(XMGLProject xmglProject,Long projectTemplateId) throws YnCorpSysException{
        //生成项目模板
        List<XMGLTemplateTask> templateTaskList = xmglTemplateTaskRepository.findAll(new Specification<XMGLTemplateTask>() {
            @Override
            public Predicate toPredicate(Root<XMGLTemplateTask> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
                query.where(
                    cb.equal(root.get("xmglProjectTemplate").get("id"),projectTemplateId),
                    cb.isNull(root.get("parentTask"))
                );
                return null;
            }
        });
        recurSaveTask(templateTaskList,null,xmglProject);
    }

    /**
     * 递归保存模板任务到项目任务
     * @param templateTasks
     * @param parentTask
     * @param xmglProject
     */
    private void recurSaveTask(List<XMGLTemplateTask> templateTasks,XMGLTask parentTask,XMGLProject xmglProject){
        for(XMGLTemplateTask templateTask : templateTasks){
            //保存任务
            XMGLTask task = new XMGLTask();
            task.setXmglProject(xmglProject);
            task.setTaskName(templateTask.getTaskName());
            task.setXmglTask(parentTask);
            task.setSequence(templateTask.getSequence());
            task = xmglTaskRepository.save(task);
            //(20160516 add by yanliang)initially set planHour and actualHour to 1
            task.setPlanHour(1d);
            task.setActualHour(1d);

            //保存预期成果文档
            List<XMGTaskTemplateMiddle> middleList = templateTask.getXmgTaskTemplateMiddleList();
            if(CollectionUtils.isNotEmpty(middleList)){
                for(XMGTaskTemplateMiddle middle : middleList){
                    XMGLExpectFile expectFile = new XMGLExpectFile();
                    expectFile.setXmglTask(task);
                    expectFile.setFastId(middle.getFastId());
                    expectFile.setFileName(middle.getFileName());
                    expectFile.setImportantLevel(middle.getImportantLevel());
                    expectFile.setProjectSubtypeId(middle.getProjectSubtypeId());
                    xmglExpectFileRepository.save(expectFile);
                }
            }

            if(CollectionUtils.isNotEmpty(templateTask.getChildrenTaskList())){
                recurSaveTask(templateTask.getChildrenTaskList(),task,xmglProject);
            }
        }
    }

    /**
     * 保存项目角色
     * @param xmglRoleDTOList
     */
    private void saveRole(List<XMGLRoleDTO> xmglRoleDTOList,XMGLProject xmglProject){
        //先删除所有的相关角色
        if(xmglProject.getId() != null){
            xmglRoleRepository.deleteByProjectId(xmglProject.getId());
        }
        for(XMGLRoleDTO roleDTO : xmglRoleDTOList){
            XMGLRole xmglRole = new XMGLRole();
            xmglRole.setXmglProject(xmglProject);
//            xmglRole.setId(roleDTO.getId());
            xmglRole.setRoleAuthCode(roleDTO.getRoleAuthCode());
            //项目角色
            if(roleDTO.getRoleTypeId() != null){
                QJGLProjectRoleType roleType = new QJGLProjectRoleType();
                roleType.setId(roleDTO.getRoleTypeId());
                xmglRole.setQjglProjectRoleType(roleType);
            }else{
                //初始角色
                xmglRole.setInitRoleType(roleDTO.getInitRoleType());
            }
            //保存
            xmglRole = xmglRoleRepository.save(xmglRole);
            //保存角色，用户中间表
            if(CollectionUtils.isNotEmpty(roleDTO.getUserDTOList())){
                //如果是项目经理，防止传多个用户过来，只取第一个
                if(xmglRole.getInitRoleType() == MANAGER_CODE && roleDTO.getUserDTOList().size()>1){
                    roleDTO.setUserDTOList(roleDTO.getUserDTOList().subList(0,1));
                }
                for(RSGLSysUserDTO userDTO : roleDTO.getUserDTOList()){
                    XMGLRoleUserMiddle middle = new XMGLRoleUserMiddle();
//                    middle.setId(userDTO.getId());
                    //用户
                    RSGLSysUser sysUser = new RSGLSysUser();
                    sysUser.setId(userDTO.getId());
                    middle.setRsglSysUser(sysUser);
                    //角色
                    middle.setXmglRole(xmglRole);
                    xmglRoleUserMiddleRepository.save(middle);
                }
            }

        }

    }

    /**
     * 删除项目
     *
     * @param id
     */
    @Override
    public void deleteProject(Long[] id) throws YnCorpSysException {
        xmglProjectRepository.deleteByIds(id);
    }

    /**
     * 通过项目子类Id查询对应角色，以及生产初始角色
     *
     * @param subTypeId
     * @return
     * @throws com.yineng.corpsysland.common.exception.YnCorpSysException
     */
    @Override
    public List<XMGLRoleDTO> findXMGLRoles(Long subTypeId) throws YnCorpSysException {
        List<XMGLRoleDTO> roleDTOList = new LinkedList<>();
        XMGLRoleDTO roleDTO = null;
        //生成初始角色
        for(XMGLInitRoleEnum roleEnum : XMGLInitRoleEnum.values()){
            roleDTO = new XMGLRoleDTO();
            roleDTO.setInitRoleType(roleEnum.getCode());
            roleDTO.setRoleName(roleEnum.getName());
            //设置全部权限
            roleDTO.setRoleAuthCode(ALL_AUTH_CODE);
            roleDTOList.add(roleDTO);
        }
        //添加项目子类角色
        roleDTOList.addAll(getSubTypeRoleList(subTypeId));
        return roleDTOList;
    }

    /**
     * 取得项目子类下的所有角色DTO
     * @param subTypeId
     * @return
     */
    private List<XMGLRoleDTO> getSubTypeRoleList(Long subTypeId){
        List<XMGLRoleDTO> roleDTOList = new ArrayList<>();
        XMGLRoleDTO roleDTO = null;

        //生成项目子类角色
        List<QJGLProjectRoleType> roleTypeList = qjglProjectRoleTypeRepository.findAll(new Specification<QJGLProjectRoleType>() {
            @Override
            public Predicate toPredicate(Root<QJGLProjectRoleType> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
                query.where(
                    cb.equal(root.get("qjglProjectSubtype").get("id"),subTypeId),
                    cb.equal(root.get("isDel"),false),
                    cb.equal(root.get("isEnabled"),true)
                );
                return null;
            }
        });
        if(CollectionUtils.isNotEmpty(roleTypeList)){
            for(QJGLProjectRoleType roleType : roleTypeList){
                roleDTO = new XMGLRoleDTO();
                roleDTO.setRoleTypeId(roleType.getId());
                roleDTO.setRoleName(roleType.getName());
                //设置任务 进度填写权限
                roleDTO.setRoleAuthCode("taskProgress");
                roleDTOList.add(roleDTO);
            }
        }

        return roleDTOList;
    }

    /**
     * 查出当前用户在此项目下的最大权限集合
     *
     * @param projectId
     * @return
     * @throws com.yineng.corpsysland.common.exception.YnCorpSysException
     */
    @Override
    public List<String> findAuthCodeByProjectId(Long projectId) throws YnCorpSysException {
        List<String> codeList = new ArrayList<>();
        //查询出当前用户在此项目<projectId>下的所有角色
        List<XMGLRole> xmglRoleList = xmglRoleRepository.findAll(new Specification<XMGLRole>() {
            @Override
            public Predicate toPredicate(Root<XMGLRole> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
                Subquery<XMGLRoleUserMiddle> subquery = query.subquery(XMGLRoleUserMiddle.class);
                Root<XMGLRoleUserMiddle> subRoot = subquery.from(XMGLRoleUserMiddle.class);
                subquery.select(subRoot);
                subquery.where(
                    cb.equal(subRoot.get("xmglRole").get("id"),root.get("id")),
                    cb.equal(subRoot.get("rsglSysUser").get("id"),SecurityUtils.getRSGLSysUserId())
                );
                query.where(
                    cb.equal(root.get("xmglProject").get("id"),projectId),
                    cb.exists(subquery)
                );
                return null;
            }
        });

        //取出所有角色，查询出权限并集
        for(XMGLRole role : xmglRoleList){
            List<String> roleCodeList = Arrays.asList(role.getRoleAuthCode().split("_"));
            //求无重复并集
            codeList.removeAll(roleCodeList);
            codeList.addAll(roleCodeList);
//            roleCodeList.removeAll(codeList);
//            codeList.addAll(roleCodeList);
        }
        return codeList;
    }

    /**
     * 查询和我的项目
     *
     * @return
     * @throws com.yineng.corpsysland.common.exception.YnCorpSysException
     */
    @Override
    public Page<XMGLProjectDTO> queryMyInvolvedProjectByConditions(XMGLProjectQueryDTO queryDTO,Pageable pageable) throws YnCorpSysException {
        Page<XMGLProject> projectPage = xmglProjectRepository.findRelatedProjectByConditions(queryDTO,pageable);

        List<XMGLProjectDTO> projectDTOList = convertDTOList(projectPage.getContent());

        return new CustomPageImpl<>(projectDTOList,pageable,projectPage.getTotalElements());
    }

    /**
     * 转换实体Lis为DTOList
     * @param xmglProjectList
     * @return
     */
    private List<XMGLProjectDTO> convertDTOList(List<XMGLProject> xmglProjectList){
        List<XMGLProjectDTO> xmglProjectDTOList = new LinkedList<XMGLProjectDTO>();
        for(XMGLProject project : xmglProjectList){
            xmglProjectDTOList.add(convertDTO(project));
        }
        return xmglProjectDTOList;

    }

    /**
     * 转化实体为DTO
     * @param xmglProject
     * @return
     */
    private XMGLProjectDTO convertDTO(XMGLProject xmglProject){
        XMGLProjectDTO xmglProjectDTO = new XMGLProjectDTO();
        //拷贝基础数据
        BeanUtils.copyProperties(xmglProject,xmglProjectDTO);
        //项目子类
        QJGLProjectSubtype subtype = xmglProject.getQjglProjectSubtype();
        if(subtype != null){
            xmglProjectDTO.setProjectType(subtype.getProjectTypeCode());
            xmglProjectDTO.setProjectTypeStr(platformCommonDictionaryService.getDictName("PROJECT_TYPE", subtype.getProjectTypeCode()));
            xmglProjectDTO.setSubProjectTypeId(subtype.getId());
            xmglProjectDTO.setSubProjectTypeStr(subtype.getName());
        }
        //项目经理，项目经理只有一个，但是可能有脏数据，所有取第一个
        List<RSGLSysUser> managerList = xmglRoleUserMiddleRepository.findManagerByProjectId(xmglProject.getId(),XMGLInitRoleEnum.MANAGER.getCode());
        if(CollectionUtils.isNotEmpty(managerList)){
            xmglProjectDTO.setManagerStr(managerList.get(0).getName());
        }
        //项目状态
        xmglProjectDTO.setProjectStatusStr(XMGLProjectStatusEnum.getName(xmglProject.getProjectStatus()));
        //项目进度
        xmglProjectDTO.setProjectProgressStr((xmglProjectDTO.getProjectProgress() != null ? xmglProjectDTO.getProjectProgress() : 0)+"%");
        //主组织机构
        PlatformSysOrganization organization = xmglProject.getResponsibleOrg();
        if(organization != null){
            xmglProjectDTO.setResponsibleOrgId(organization.getId());
            xmglProjectDTO.setResponsibleOrgStr(organization.getName());
        }
        //项目模板
        //(20160428 modify by yanliang)使用实体映射，出现脏数据，会有报无法找到实体的错，所以使用repository查询方法
//        XMGLProjectTemplate template = xmglProject.getXmglProjectTemplate();
        XMGLProjectTemplate template = xmglProject.getProjectTemplateId() != null ?
            xmglProjectTemplateRepository.findOne(xmglProject.getProjectTemplateId())
            : null;
        if(template != null){
            xmglProjectDTO.setProjectTemplateId(template.getId());
            xmglProjectDTO.setProjectTemplateName(template.getTemplateName());
        }
        //(20160606 remove by yanliang)现在在修改任务的实际时间时，会存项目的实际时间
        //实际开始、结束时间，取最顶级任务的实际开始时间？
//        List<XMGLTask> xmglTaskList = xmglTaskRepository.findAll(new Specification<XMGLTask>() {
//            @Override
//            public Predicate toPredicate(Root<XMGLTask> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
//                query.where(
//                    cb.equal(root.get("xmglProject").get("id"),xmglProject.getId()),
//                    cb.isNull(root.get("xmglTask"))
//                );
//                return null;
//            }
//        });
//        if (CollectionUtils.isNotEmpty(xmglTaskList)){
//            xmglProjectDTO.setActualStartDate(xmglTaskList.get(0).getActualStartDate());
//            xmglProjectDTO.setActualEndDate(xmglTaskList.get(0).getActualEndDate());
//        }

        return xmglProjectDTO;
    }


}
